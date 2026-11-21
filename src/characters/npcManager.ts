import * as THREE from 'three';
import type { SimulationEngine } from '../core/simulationEngine';
import type { Customer, Employee, InteractableTarget } from '../core/types';
import { buildArticulatedCharacter, type ArticulatedCharacter } from '../world/characterBuilder';

interface NPCEntity {
  id: string;
  rig: ArticulatedCharacter;
  targetPos: THREE.Vector3;
  lookTarget: THREE.Vector3;
  speed: number;
  wanderTimer: number;
  isSitting?: boolean;
  exitStage?: 0 | 1 | 2; // 0 = inside, 1 = walking to door, 2 = walking down street
  exitSide?: number;
  leavingStage?: 0 | 1 | 2 | 3;
  visitPhase?: 'entering' | 'waiting_escort' | 'escorting_door' | 'escorting_sofa' | 'seated' | 'leaving';
  shipPhase?: 'none' | 'to_wh_exit' | 'to_door' | 'to_street' | 'away' | 'returning_door';
}

interface SeparationActor {
  pos: THREE.Vector3;
  pinned: boolean;
  visible: boolean;
}

const MIN_NPC_SPACING = 0.78;
const MIN_NPC_SPACING_SQ = MIN_NPC_SPACING * MIN_NPC_SPACING;

const ZONE_WORKSTATIONS: Record<Employee['homeZone'], { pos: THREE.Vector3; look: THREE.Vector3 }> = {
  assistant: { pos: new THREE.Vector3(-1.1, 0, -1.72), look: new THREE.Vector3(-1.1, 0, -0.5) },
  showroom: { pos: new THREE.Vector3(-2.6, 0, 3.2), look: new THREE.Vector3(-1.0, 0, 5.0) },
  cashier: { pos: new THREE.Vector3(6.6, 0, 5.25), look: new THREE.Vector3(6.6, 0, 3.5) },
  tech: { pos: new THREE.Vector3(7.6, 0, -5.42), look: new THREE.Vector3(7.6, 0, -4.4) },
  warehouse: { pos: new THREE.Vector3(1.4, 0, -7.2), look: new THREE.Vector3(0.0, 0, -8.5) },
  online_cs: { pos: new THREE.Vector3(6.35, 0, 0.35), look: new THREE.Vector3(6.35, 0, 1.35) },
  shipping: { pos: new THREE.Vector3(2.95, 0, -4.55), look: new THREE.Vector3(2.95, 0, -5.6) },
  director: { pos: new THREE.Vector3(-5.0, 0, -5.8), look: new THREE.Vector3(-6.5, 0, -6.5) },
};

const TECH_STATIONS: { pos: THREE.Vector3; look: THREE.Vector3 }[] = [
  { pos: new THREE.Vector3(7.6, 0, -5.42), look: new THREE.Vector3(7.6, 0, -4.4) },
  { pos: new THREE.Vector3(8.25, 0, -7.2), look: new THREE.Vector3(9.2, 0, -7.2) },
  { pos: new THREE.Vector3(8.25, 0, -1.7), look: new THREE.Vector3(9.2, 0, -1.7) },
];

// Repair customers ALWAYS wait on waiting chairs outside the Tech Lab (never enter Tech Lab)
const REPAIR_WAITING_SEATS: { pos: THREE.Vector3; look: THREE.Vector3 }[] = [
  { pos: new THREE.Vector3(1.6, 0, -1.8), look: new THREE.Vector3(1.6, 0, 0.5) },
  { pos: new THREE.Vector3(2.35, 0, -1.8), look: new THREE.Vector3(2.35, 0, 0.5) },
  { pos: new THREE.Vector3(3.1, 0, -1.8), look: new THREE.Vector3(3.1, 0, 0.5) },
  { pos: new THREE.Vector3(2.65, 0, 6.08), look: new THREE.Vector3(2.65, 0, 4.0) },
  { pos: new THREE.Vector3(3.65, 0, 6.08), look: new THREE.Vector3(3.65, 0, 4.0) },
];

// Well-spaced showroom positions clear of all display tables and walkways (>= 1.2m apart)
const SHOWROOM_SPOTS: THREE.Vector3[] = [
  new THREE.Vector3(-4.8, 0, 6.35),
  new THREE.Vector3(-3.1, 0, 4.85),
  new THREE.Vector3(-0.2, 0, 4.85),
  new THREE.Vector3(-1.85, 0, 2.95),
  new THREE.Vector3(-4.8, 0, 3.85),
  new THREE.Vector3(-7.9, 0, 4.85),
  new THREE.Vector3(-7.9, 0, 2.75),
  new THREE.Vector3(0.4, 0, 1.85),
  new THREE.Vector3(-2.9, 0, 1.35),
  new THREE.Vector3(2.05, 0, 3.85),
];

// Non-overlapping cashier queue slots
const CASHIER_QUEUE_SLOTS: THREE.Vector3[] = [
  new THREE.Vector3(6.6, 0, 3.35),
  new THREE.Vector3(5.65, 0, 3.25),
  new THREE.Vector3(4.75, 0, 3.25),
  new THREE.Vector3(7.6, 0, 3.35),
  new THREE.Vector3(5.65, 0, 2.35),
  new THREE.Vector3(4.75, 0, 2.35),
  new THREE.Vector3(6.6, 0, 2.25),
  new THREE.Vector3(7.6, 0, 2.35),
];

const SALES_CONSULT_OFFSETS: [number, number][] = [
  [0.88, 0.12],
  [-0.88, 0.12],
  [0.12, 0.88],
  [0.12, -0.88],
];

function tagNPC(obj: THREE.Object3D, data: InteractableTarget): void {
  obj.traverse((c) => {
    c.userData.interactable = data;
  });
}

export class NPCManager {
  private scene: THREE.Scene;
  private interactables: THREE.Object3D[];
  private contactShadowTex: THREE.Texture;

  private staffEntities = new Map<string, NPCEntity>();
  private customerEntities = new Map<string, NPCEntity>();
  private supplierEntity: NPCEntity | null = null;
  private pedestrians: { rig: ArticulatedCharacter; dir: 1 | -1; speed: number }[] = [];

  private _dirVec = new THREE.Vector3();
  private _sepActors: SeparationActor[] = [];

  constructor(
    scene: THREE.Scene,
    interactables: THREE.Object3D[],
    contactShadowTex: THREE.Texture,
  ) {
    this.scene = scene;
    this.interactables = interactables;
    this.contactShadowTex = contactShadowTex;
    this.spawnSidewalkPedestrians();
  }

  private spawnSidewalkPedestrians(): void {
    const shirts = ['#0ea5e9', '#f59e0b', '#10b981', '#6366f1'];
    const hairs = ['short', 'long', 'bob', 'ponytail'] as const;
    const outfits = ['tshirt', 'jacket', 'hoodie', 'polo'] as const;
    const lanes = [8.9, 9.55, 8.9, 9.55];
    const startXs = [-19, 17, 2, -6];
    for (let i = 0; i < 4; i++) {
      const rig = buildArticulatedCharacter({
        shirtColor: shirts[i],
        skinColor: '#f1c27d',
        hairColor: '#1c1917',
        hairStyle: hairs[i],
        outfitStyle: outfits[i],
        contactShadowTex: this.contactShadowTex,
      });
      const dir: 1 | -1 = i % 2 === 0 ? 1 : -1;
      rig.group.position.set(startXs[i], 0, lanes[i]);
      rig.group.rotation.y = dir === 1 ? Math.PI / 2 : -Math.PI / 2;
      rig.setAnimation('walk');
      this.scene.add(rig.group);
      this.pedestrians.push({ rig, dir, speed: 1.15 + (i % 2) * 0.25 });
    }
  }

  public syncWithSimulation(sim: SimulationEngine): void {
    const employees = sim.state.employees;
    const empIds = new Set(employees.map((e) => e.id));

    for (const [id, ent] of this.staffEntities.entries()) {
      if (!empIds.has(id)) {
        this.scene.remove(ent.rig.group);
        const idx = this.interactables.indexOf(ent.rig.group);
        if (idx !== -1) this.interactables.splice(idx, 1);
        this.staffEntities.delete(id);
      }
    }

    const deptCounts: Record<string, number> = {};
    employees.forEach((emp, index) => {
      const deptSlot = deptCounts[emp.department] ?? 0;
      deptCounts[emp.department] = deptSlot + 1;

      const techStation = TECH_STATIONS[deptSlot % TECH_STATIONS.length];

      let ent = this.staffEntities.get(emp.id);
      if (!ent) {
        const rig = buildArticulatedCharacter({
          shirtColor: emp.shirtColor,
          skinColor: emp.avatarColor,
          hairColor: emp.hairColor,
          hairStyle: index % 2 === 0 ? 'side_part' : 'ponytail',
          outfitStyle: emp.isAssistant ? 'formal' : 'polo',
          isAssistant: emp.isAssistant,
          hasBadge: !emp.isAssistant,
          contactShadowTex: this.contactShadowTex,
        });
        const home = emp.department === 'tech' ? techStation : ZONE_WORKSTATIONS[emp.homeZone];
        const spawnOffsetX =
          emp.department === 'tech' || emp.isAssistant || emp.department === 'cs'
            ? 0
            : deptSlot * 0.85;
        rig.group.position.set(home.pos.x + spawnOffsetX, 0, home.pos.z);
        this.scene.add(rig.group);
        this.interactables.push(rig.group);
        ent = {
          id: emp.id,
          rig,
          targetPos: rig.group.position.clone(),
          lookTarget: home.look.clone(),
          speed: 1.65,
          wanderTimer: 2 + index,
          exitStage: 0,
          exitSide: index % 2 === 0 ? 13.5 : -13.5,
          shipPhase: 'none',
        };
        this.staffEntities.set(emp.id, ent);
      }

      tagNPC(ent.rig.group, {
        id: emp.id,
        type: emp.isAssistant ? 'assistant_npc' : 'employee_npc',
        label: emp.isAssistant ? `Trợ lý ${emp.name}` : `${emp.name} (${emp.role})`,
        sublabel:
          emp.state === 'off_duty'
            ? 'Đã chấm công tan làm (22:00)'
            : emp.state === 'shipping'
              ? 'Đang giao đơn đặt hàng online tới khách'
              : emp.state === 'packing'
                ? 'Đang đóng gói hàng từ kho'
                : emp.state === 'online_cs'
                  ? 'Đang tư vấn & chốt đơn online'
                  : emp.isAssistant
                    ? 'Nhận báo cáo & tiếp đón đối tác'
                    : 'Kiểm tra tiến độ & quản lý nhân sự',
        payloadId: emp.id,
      });

      // Carried shipping parcel visibility
      ent.rig.carriedParcel.visible = emp.state === 'shipping' && ent.shipPhase !== 'away';

      // Handle 22:00 Clock-out walk-out vs 06:00 Morning return
      if (emp.state === 'off_duty') {
        ent.rig.carriedParcel.visible = false;
        ent.shipPhase = 'none';
        const pos = ent.rig.group.position;
        if ((ent.exitStage ?? 0) === 0) {
          ent.exitStage = 1;
          ent.targetPos.set(((index % 3) - 1) * 0.5, 0, 8.6);
          if (pos.x < -2.5 && pos.z < -2.4 && !sim.state.directorDoorOpen) sim.toggleDirectorDoor();
          if (!sim.state.doorOpen) sim.toggleDoor();
        } else if (ent.exitStage === 1 && pos.distanceTo(ent.targetPos) < 0.45) {
          ent.exitStage = 2;
          ent.targetPos.set((ent.exitSide ?? 13.5) + (index % 3) * 0.8, 0, 10.7 + (index % 2) * 0.45);
        } else if (ent.exitStage === 2 && pos.distanceTo(ent.targetPos) < 0.45) {
          ent.rig.group.visible = false;
        }
        return;
      } else if ((ent.exitStage ?? 0) !== 0 || (!ent.rig.group.visible && emp.state !== 'shipping')) {
        // Morning 06:00 clock-in: walk back in from entrance with distinct X lane
        ent.exitStage = 0;
        ent.rig.group.visible = true;
        ent.rig.group.position.set(((index % 5) - 2) * 0.55, 0, 9.6 + (index % 2) * 0.45);
        if (!sim.state.doorOpen) sim.toggleDoor();
      }

      // Shipping Delivery Run (Department: shipping)
      if (emp.state === 'shipping') {
        const pos = ent.rig.group.position;
        if (!ent.shipPhase || ent.shipPhase === 'none' || ent.shipPhase === 'returning_door') {
          ent.shipPhase = 'to_wh_exit';
          ent.targetPos.set(1.4 + deptSlot * 0.45, 0, -2.1);
          ent.lookTarget.set(1.4, 0, 2.0);
        } else if (ent.shipPhase === 'to_wh_exit' && pos.distanceTo(ent.targetPos) < 0.45) {
          ent.shipPhase = 'to_door';
          ent.targetPos.set(0.35 + deptSlot * 0.4, 0, 8.6);
          if (!sim.state.doorOpen) sim.toggleDoor();
        } else if (ent.shipPhase === 'to_door' && pos.distanceTo(ent.targetPos) < 0.45) {
          ent.shipPhase = 'to_street';
          ent.targetPos.set(14.5, 0, 10.65);
        } else if (ent.shipPhase === 'to_street' && pos.distanceTo(ent.targetPos) < 0.55) {
          ent.shipPhase = 'away';
          ent.rig.group.visible = false;
        }
        return;
      } else if (ent.shipPhase && ent.shipPhase !== 'none') {
        // Finished shipping delivery -> walk back in through front door to warehouse packing bench
        if (ent.shipPhase === 'away' || ent.shipPhase === 'to_street') {
          ent.rig.group.visible = true;
          ent.rig.group.position.set(1.2, 0, 9.8);
          if (!sim.state.doorOpen) sim.toggleDoor();
        }
        ent.shipPhase = 'returning_door';
        ent.targetPos.set(2.95 + deptSlot * 0.85, 0, -4.55);
        ent.lookTarget.set(2.95, 0, -5.6);
        if (ent.rig.group.position.distanceTo(ent.targetPos) < 0.55) {
          ent.shipPhase = 'none';
        }
        return;
      }

      const escortingPartner =
        emp.isAssistant &&
        this.supplierEntity &&
        this.supplierEntity.visitPhase &&
        this.supplierEntity.visitPhase !== 'seated' &&
        this.supplierEntity.visitPhase !== 'leaving';

      if (escortingPartner && this.supplierEntity) {
        const phase = this.supplierEntity.visitPhase;
        if (phase === 'entering' || phase === 'waiting_escort') {
          ent.targetPos.set(-1.45, 0, -0.35);
          ent.lookTarget.set(-2.5, 0, 0.4);
        } else if (phase === 'escorting_door') {
          ent.targetPos.set(-4.35, 0, -1.85);
          ent.lookTarget.set(-5.8, 0, -0.8);
        } else if (phase === 'escorting_sofa') {
          ent.targetPos.set(-5.25, 0, -1.95);
          ent.lookTarget.set(-7.35, 0, 0.16);
        }
      } else if (emp.state === 'reporting') {
        if (!sim.state.directorDoorOpen) sim.toggleDirectorDoor();
        ent.targetPos.set(-5.05, 0, -5.65);
        ent.lookTarget.set(-6.5, 0, -6.5);
      } else if (emp.state === 'consulting') {
        const cust = sim.state.customers.find((c) => c.assignedEmployeeId === emp.id);
        const cEnt = cust ? this.customerEntities.get(cust.id) : null;
        if (cEnt) {
          const offset = SALES_CONSULT_OFFSETS[deptSlot % SALES_CONSULT_OFFSETS.length];
          ent.targetPos.set(
            THREE.MathUtils.clamp(cEnt.rig.group.position.x + offset[0], -8.6, 3.6),
            0,
            THREE.MathUtils.clamp(cEnt.rig.group.position.z + offset[1], -1.2, 6.8),
          );
          ent.lookTarget.copy(cEnt.rig.group.position);
        }
      } else if (emp.state === 'cashier') {
        const payingCust = sim.state.customers.find(
          (c) => c.assignedEmployeeId === emp.id && c.state === 'paying',
        );
        const cEnt = payingCust ? this.customerEntities.get(payingCust.id) : null;
        const activeTask = emp.currentTaskId
          ? sim.state.tasks.find((t) => t.id === emp.currentTaskId)
          : null;
        ent.targetPos.set(6.6 + deptSlot * 0.95, 0, 5.25);
        if (cEnt && activeTask && activeTask.progress >= 0.5) {
          ent.lookTarget.copy(cEnt.rig.group.position);
        } else {
          ent.lookTarget.set(6.6 + deptSlot * 0.95, 0, 4.3);
        }
      } else if (emp.state === 'repairing' || emp.department === 'tech') {
        ent.targetPos.copy(techStation.pos);
        ent.lookTarget.copy(techStation.look);
      } else if (emp.department === 'warehouse') {
        if (emp.state === 'packing') {
          ent.targetPos.set(2.85 + deptSlot * 0.65, 0, -4.65);
          ent.lookTarget.set(2.95, 0, -5.6);
        } else {
          ent.targetPos.set(1.3 + deptSlot * 0.9, 0, -7.2);
          ent.lookTarget.set(0.0, 0, -8.6);
        }
      } else if (emp.department === 'cs') {
        const csX = 6.35 + deptSlot * 1.05;
        ent.targetPos.set(csX, 0, 0.35);
        ent.lookTarget.set(csX, 0, 1.35);
      } else if (emp.department === 'shipping') {
        ent.targetPos.set(2.95 + deptSlot * 0.85, 0, -4.55);
        ent.lookTarget.set(2.95, 0, -5.6);
      } else if (emp.isAssistant) {
        ent.targetPos.set(-1.1, 0, -1.72);
        ent.lookTarget.set(-1.1, 0, -0.5);
      } else if (emp.department === 'sales') {
        ent.wanderTimer -= 0.05;
        if (ent.wanderTimer <= 0) {
          const spotIdx = (deptSlot * 3 + Math.floor(Math.random() * 3)) % SHOWROOM_SPOTS.length;
          const spot = SHOWROOM_SPOTS[spotIdx];
          ent.targetPos.set(spot.x + (deptSlot % 2 === 0 ? 0.5 : -0.5), 0, spot.z);
          ent.wanderTimer = 8 + Math.random() * 8;
        }
      } else {
        const home = ZONE_WORKSTATIONS[emp.homeZone];
        ent.targetPos.set(home.pos.x + deptSlot * 0.85, 0, home.pos.z);
        ent.lookTarget.copy(home.look);
      }
    });

    // Sync Customers
    const custIds = new Set(sim.state.customers.map((c) => c.id));
    for (const [id, ent] of this.customerEntities.entries()) {
      if (!custIds.has(id)) {
        this.scene.remove(ent.rig.group);
        const idx = this.interactables.indexOf(ent.rig.group);
        if (idx !== -1) this.interactables.splice(idx, 1);
        this.customerEntities.delete(id);
      }
    }

    let repairSeatCounter = 0;
    let showroomSlotCounter = 0;
    let cashierQueueCounter = 0;
    let enteringCounter = 0;

    sim.state.customers.forEach((cust: Customer, idx: number) => {
      let ent = this.customerEntities.get(cust.id);
      if (!ent) {
        const rig = buildArticulatedCharacter({
          shirtColor: cust.shirtColor,
          pantsColor: cust.pantsColor,
          skinColor: cust.skinColor,
          hairColor: cust.hairColor,
          hairStyle: cust.hairStyle,
          outfitStyle: cust.outfitStyle,
          hasGlasses: cust.hasGlasses,
          heightScale: cust.heightScale,
          contactShadowTex: this.contactShadowTex,
        });
        rig.group.position.set(-1.2 + (idx % 4) * 0.85, 0, 10.2 + (idx % 2) * 0.4);
        this.scene.add(rig.group);
        this.interactables.push(rig.group);
        ent = {
          id: cust.id,
          rig,
          targetPos: new THREE.Vector3(0, 0, 6.4),
          lookTarget: new THREE.Vector3(0, 0, 2.5),
          speed: 1.55,
          wanderTimer: 0,
          exitStage: 0,
          exitSide: idx % 2 === 0 ? 12.5 : -12.5,
        };
        this.customerEntities.set(cust.id, ent);
      }

      tagNPC(ent.rig.group, {
        id: cust.id,
        type: 'customer_npc',
        label: `Khách hàng ${cust.name}`,
        sublabel:
          cust.desiredTier === 'repair'
            ? `Đang ngồi đợi sửa: ${cust.repairIssue}`
            : cust.desiredTier === 'accessory'
              ? `Mua phụ kiện: ${cust.accessoryItem ?? 'Phụ kiện'}`
              : cust.desiredTier === 'sell_used'
                ? `Bán máy cũ: ${cust.tradeInDevice ?? 'Điện thoại cũ'}`
                : 'Đang tìm hiểu sản phẩm',
        payloadId: cust.id,
      });

      if (cust.state === 'entering') {
        const laneX = ((enteringCounter % 3) - 1) * 0.72;
        const laneZ = 6.35 + Math.floor(enteringCounter / 3) * 0.8;
        enteringCounter++;
        ent.targetPos.set(laneX, 0, laneZ);
      } else if (
        cust.state === 'browsing' ||
        cust.state === 'waiting_advisor' ||
        cust.state === 'consulting'
      ) {
        const spot = SHOWROOM_SPOTS[showroomSlotCounter % SHOWROOM_SPOTS.length];
        const ring = Math.floor(showroomSlotCounter / SHOWROOM_SPOTS.length);
        showroomSlotCounter++;
        ent.targetPos.set(spot.x + ring * 0.85, 0, spot.z);
        const empEnt = cust.assignedEmployeeId
          ? this.staffEntities.get(cust.assignedEmployeeId)
          : null;
        if (cust.state === 'consulting' && empEnt) {
          ent.lookTarget.copy(empEnt.rig.group.position);
        } else {
          ent.lookTarget.set(-2.4, 0, 3.2);
        }
      } else if (cust.state === 'waiting_cashier' || cust.state === 'paying') {
        const qSlot = CASHIER_QUEUE_SLOTS[cashierQueueCounter % CASHIER_QUEUE_SLOTS.length];
        cashierQueueCounter++;
        ent.targetPos.copy(qSlot);
        const empEnt = cust.assignedEmployeeId
          ? this.staffEntities.get(cust.assignedEmployeeId)
          : null;
        if (cust.state === 'paying' && empEnt) {
          ent.lookTarget.copy(empEnt.rig.group.position);
        } else {
          ent.lookTarget.set(6.6, 0, 4.4);
        }
      } else if (cust.state === 'repair_dropoff') {
        const seat = REPAIR_WAITING_SEATS[repairSeatCounter % REPAIR_WAITING_SEATS.length];
        repairSeatCounter++;
        ent.targetPos.copy(seat.pos);
        ent.lookTarget.copy(seat.look);
      } else if (cust.state === 'leaving') {
        // Two-stage walk-out with distinct lateral offsets so leaving NPCs don't overlap
        const pos = ent.rig.group.position;
        const laneOffset = ((idx % 3) - 1) * 0.45;
        if (ent.exitStage === 0) {
          ent.exitStage = 1;
          ent.targetPos.set(laneOffset, 0, 8.6);
          if (!sim.state.doorOpen) sim.toggleDoor();
        } else if (ent.exitStage === 1 && pos.distanceTo(ent.targetPos) < 0.45) {
          ent.exitStage = 2;
          ent.targetPos.set((ent.exitSide ?? 12.5) + (idx % 3) * 0.6, 0, 10.65 + (idx % 2) * 0.45);
        } else if (ent.exitStage === 2 && pos.distanceTo(ent.targetPos) < 0.45) {
          sim.markCustomerExited(cust.id);
        }
      }
    });

    // Visiting Supplier Representative: greeted & escorted by Assistant into VIP Reception Room (Phòng Tiếp Khách), then walks out when signed!
    const activeVisit = sim.state.activeSupplierVisitId
      ? sim.state.contracts.find((c) => c.id === sim.state.activeSupplierVisitId)
      : null;

    if (activeVisit && !this.supplierEntity) {
      const rig = buildArticulatedCharacter({
        shirtColor: '#0f172a',
        pantsColor: '#0f172a',
        skinColor: '#f1c27d',
        hairColor: '#292524',
        hairStyle: 'side_part',
        outfitStyle: 'formal',
        hasGlasses: true,
        isFormal: true,
        contactShadowTex: this.contactShadowTex,
      });
      rig.group.position.set(0.4, 0, 10.4);
      this.scene.add(rig.group);
      this.interactables.push(rig.group);
      if (!sim.state.doorOpen) sim.toggleDoor();
      this.supplierEntity = {
        id: activeVisit.id,
        rig,
        targetPos: new THREE.Vector3(-2.5, 0, 0.45),
        lookTarget: new THREE.Vector3(-1.45, 0, -0.35),
        speed: 1.55,
        wanderTimer: 0,
        leavingStage: 0,
        visitPhase: 'entering',
      };
      tagNPC(rig.group, {
        id: activeVisit.id,
        type: 'supplier_rep',
        label: `Đối tác ${activeVisit.repName}`,
        sublabel: `Ngồi tại Phòng Tiếp Khách chờ ký HĐ (${activeVisit.supplierName})`,
        payloadId: activeVisit.id,
      });
    } else if (activeVisit && this.supplierEntity) {
      const pos = this.supplierEntity.rig.group.position;
      const astEnt = this.staffEntities.get('emp_assistant');
      if (this.supplierEntity.visitPhase === 'entering' && pos.distanceTo(this.supplierEntity.targetPos) < 0.4) {
        this.supplierEntity.visitPhase = 'waiting_escort';
      } else if (
        this.supplierEntity.visitPhase === 'waiting_escort' &&
        (!astEnt || astEnt.rig.group.position.distanceTo(new THREE.Vector3(-1.45, 0, -0.35)) < 0.85)
      ) {
        this.supplierEntity.visitPhase = 'escorting_door';
        this.supplierEntity.targetPos.set(-4.15, 0, -0.45);
        this.supplierEntity.lookTarget.set(-7.35, 0, -0.45);
      } else if (this.supplierEntity.visitPhase === 'escorting_door' && pos.distanceTo(this.supplierEntity.targetPos) < 0.45) {
        this.supplierEntity.visitPhase = 'escorting_sofa';
        this.supplierEntity.targetPos.set(-7.35, 0, 0.16);
        this.supplierEntity.lookTarget.set(-7.8, 0, -1.12);
      } else if (this.supplierEntity.visitPhase === 'escorting_sofa' && pos.distanceTo(this.supplierEntity.targetPos) < 0.25) {
        this.supplierEntity.visitPhase = 'seated';
      }
    } else if (!activeVisit && this.supplierEntity) {
      // Transition supplier rep to smooth multi-waypoint exit walk out of VIP Reception Room!
      this.supplierEntity.visitPhase = 'leaving';
      const pos = this.supplierEntity.rig.group.position;
      if ((this.supplierEntity.leavingStage ?? 0) === 0) {
        this.supplierEntity.leavingStage = 1;
        this.supplierEntity.targetPos.set(-4.15, 0, -0.45); // Step out through VIP Reception Room doorway
      } else if (this.supplierEntity.leavingStage === 1 && pos.distanceTo(this.supplierEntity.targetPos) < 0.4) {
        this.supplierEntity.leavingStage = 2;
        this.supplierEntity.targetPos.set(0.3, 0, 8.6); // Walk to main storefront exit
        if (!sim.state.doorOpen) sim.toggleDoor();
      } else if (this.supplierEntity.leavingStage === 2 && pos.distanceTo(this.supplierEntity.targetPos) < 0.45) {
        this.supplierEntity.leavingStage = 3;
        this.supplierEntity.targetPos.set(13.5, 0, 10.7); // Walk off along sidewalk
      } else if (this.supplierEntity.leavingStage === 3 && pos.distanceTo(this.supplierEntity.targetPos) < 0.5) {
        this.scene.remove(this.supplierEntity.rig.group);
        const idx = this.interactables.indexOf(this.supplierEntity.rig.group);
        if (idx !== -1) this.interactables.splice(idx, 1);
        this.supplierEntity = null;
      }
    }
  }

  private applyCharacterSeparation(dt: number): void {
    const actors = this._sepActors;
    actors.length = 0;

    for (const ent of this.staffEntities.values()) {
      actors.push({
        pos: ent.rig.group.position,
        pinned: Boolean(ent.isSitting),
        visible: ent.rig.group.visible,
      });
    }
    for (const ent of this.customerEntities.values()) {
      actors.push({
        pos: ent.rig.group.position,
        pinned: Boolean(ent.isSitting),
        visible: ent.rig.group.visible,
      });
    }
    if (this.supplierEntity) {
      actors.push({
        pos: this.supplierEntity.rig.group.position,
        pinned: Boolean(this.supplierEntity.isSitting),
        visible: this.supplierEntity.rig.group.visible,
      });
    }

    const maxPush = Math.min(0.18, 2.4 * dt);
    const n = actors.length;
    for (let i = 0; i < n; i++) {
      const a = actors[i];
      if (!a.visible) continue;
      for (let j = i + 1; j < n; j++) {
        const b = actors[j];
        if (!b.visible) continue;
        if (a.pinned && b.pinned) continue;

        let dx = b.pos.x - a.pos.x;
        let dz = b.pos.z - a.pos.z;
        let dSq = dx * dx + dz * dz;
        if (dSq >= MIN_NPC_SPACING_SQ) continue;

        if (dSq < 0.0004) {
          // Deterministic tie-breaker when nearly coincident
          const angle = (i * 1.7 + j * 2.3) % (Math.PI * 2);
          dx = Math.cos(angle);
          dz = Math.sin(angle);
          dSq = 1;
        }

        const dist = Math.sqrt(dSq);
        const overlap = MIN_NPC_SPACING - dist;
        const push = Math.min(maxPush, overlap * 0.55);
        const nx = dx / dist;
        const nz = dz / dist;

        if (a.pinned && !b.pinned) {
          b.pos.x += nx * push * 1.6;
          b.pos.z += nz * push * 1.6;
        } else if (!a.pinned && b.pinned) {
          a.pos.x -= nx * push * 1.6;
          a.pos.z -= nz * push * 1.6;
        } else {
          a.pos.x -= nx * push;
          a.pos.z -= nz * push;
          b.pos.x += nx * push;
          b.pos.z += nz * push;
        }
      }
    }
  }

  public update(dt: number, sim: SimulationEngine): void {
    this.syncWithSimulation(sim);

    const updateEntity = (
      ent: NPCEntity,
      pose: 'idle' | 'work' | 'sit' | 'sit_work' | 'pc_sit' | 'pc_stand' | 'talk_customer' | 'listen_customer',
      isSitting = false,
    ) => {
      ent.isSitting = isSitting;
      if (!ent.rig.group.visible) return;
      const pos = ent.rig.group.position;
      this._dirVec.subVectors(ent.targetPos, pos);
      this._dirVec.y = 0;
      const dist = this._dirVec.length();

      if (dist > 0.14) {
        ent.isSitting = false;
        this._dirVec.normalize();
        const step = Math.min(dist, ent.speed * dt);
        pos.addScaledVector(this._dirVec, step);
        const targetYaw = Math.atan2(this._dirVec.x, this._dirVec.z);
        ent.rig.group.rotation.y = lerpAngle(ent.rig.group.rotation.y, targetYaw, 1 - Math.exp(-8 * dt));
        ent.rig.setAnimation('walk');
      } else {
        ent.rig.setAnimation(pose);
        const lx = ent.lookTarget.x - pos.x;
        const lz = ent.lookTarget.z - pos.z;
        if (lx * lx + lz * lz > 0.01) {
          const targetYaw = Math.atan2(lx, lz);
          ent.rig.group.rotation.y = lerpAngle(ent.rig.group.rotation.y, targetYaw, 1 - Math.exp(-6 * dt));
        }
      }
      ent.rig.mixer.update(dt);
    };

    const escortActive = Boolean(
      this.supplierEntity &&
        this.supplierEntity.visitPhase &&
        this.supplierEntity.visitPhase !== 'seated' &&
        this.supplierEntity.visitPhase !== 'leaving',
    );

    const techSlotsSeen = new Map<string, number>();
    let tIdx = 0;
    for (const e of sim.state.employees) {
      if (e.department === 'tech') {
        techSlotsSeen.set(e.id, tIdx++);
      }
    }

    sim.state.employees.forEach((emp, empIdx) => {
      const ent = this.staffEntities.get(emp.id);
      if (!ent) return;
      ent.rig.heldDevice.visible = false;

      if (emp.state === 'off_duty' || emp.state === 'shipping' || (ent.shipPhase && ent.shipPhase !== 'none')) {
        updateEntity(ent, 'idle', false);
        return;
      }

      if (emp.isAssistant) {
        if (escortActive && this.supplierEntity?.visitPhase === 'waiting_escort') {
          updateEntity(ent, 'talk_customer', false);
        } else if (emp.state === 'reporting' || escortActive) {
          updateEntity(ent, emp.state === 'reporting' ? 'talk_customer' : 'idle', false);
        } else {
          // Assistant seated at her Windows PC typing & coordinating
          const usingPc = Math.sin(sim.state.totalMinutes * 0.25 + empIdx) > -0.45;
          updateEntity(ent, usingPc ? 'pc_sit' : 'sit', true);
        }
        return;
      }

      if (emp.department === 'cs') {
        // Online CSKH seated inside Phòng Kỹ Thuật working on Windows PC
        const activeCs = emp.state === 'online_cs' || Math.sin(sim.state.totalMinutes * 0.3 + empIdx) > -0.35;
        updateEntity(ent, activeCs ? 'pc_sit' : 'sit', true);
        return;
      }

      if (emp.department === 'tech') {
        const tSlot = techSlotsSeen.get(emp.id) ?? 0;
        const usesWindowsPc = tSlot % TECH_STATIONS.length === 2;
        if (usesWindowsPc) {
          const working = emp.state !== 'idle' && emp.state !== 'break';
          updateEntity(ent, working ? 'pc_sit' : 'sit', true);
        } else {
          const working = emp.state !== 'idle' && emp.state !== 'break';
          updateEntity(ent, working ? 'sit_work' : 'sit', true);
        }
        return;
      }

      if (emp.department === 'cashier' || emp.state === 'cashier') {
        const payingCust = sim.state.customers.find(
          (c) => c.assignedEmployeeId === emp.id && c.state === 'paying',
        );
        const activeTask = emp.currentTaskId
          ? sim.state.tasks.find((t) => t.id === emp.currentTaskId)
          : null;
        if (payingCust && activeTask && activeTask.progress >= 0.5) {
          updateEntity(ent, 'talk_customer', false);
        } else if (emp.state === 'cashier' || Math.sin(sim.state.totalMinutes * 0.35 + empIdx) > -0.2) {
          updateEntity(ent, 'pc_stand', false);
        } else {
          updateEntity(ent, 'idle', false);
        }
        return;
      }

      if (emp.state === 'consulting') {
        const cust = sim.state.customers.find((c) => c.assignedEmployeeId === emp.id);
        const cEnt = cust ? this.customerEntities.get(cust.id) : null;
        if (cEnt && ent.rig.group.position.distanceTo(cEnt.rig.group.position) < 1.85) {
          ent.rig.heldDevice.visible = cust?.desiredTier !== 'accessory';
          updateEntity(ent, 'talk_customer', false);
        } else {
          updateEntity(ent, 'work', false);
        }
        return;
      }

      const working = emp.state !== 'idle' && emp.state !== 'break';
      updateEntity(ent, working ? 'work' : 'idle', false);
    });

    for (const cust of sim.state.customers) {
      const ent = this.customerEntities.get(cust.id);
      if (!ent) continue;
      ent.rig.heldDevice.visible = false;

      if (cust.state === 'repair_dropoff') {
        updateEntity(ent, 'sit', true);
      } else if (cust.state === 'consulting') {
        const empEnt = cust.assignedEmployeeId ? this.staffEntities.get(cust.assignedEmployeeId) : null;
        const nearAdvisor = empEnt
          ? ent.rig.group.position.distanceTo(empEnt.rig.group.position) < 1.95
          : true;
        if (cust.desiredTier === 'sell_used' && nearAdvisor) {
          ent.rig.heldDevice.visible = true;
        }
        updateEntity(ent, nearAdvisor ? 'listen_customer' : 'idle', false);
      } else if (cust.state === 'paying') {
        if (cust.desiredTier === 'sell_used') ent.rig.heldDevice.visible = true;
        updateEntity(ent, 'listen_customer', false);
      } else {
        updateEntity(ent, 'idle', false);
      }
    }

    if (this.supplierEntity) {
      const isSitting = this.supplierEntity.visitPhase === 'seated';
      const isGreeting = this.supplierEntity.visitPhase === 'waiting_escort';
      updateEntity(this.supplierEntity, isGreeting ? 'listen_customer' : isSitting ? 'sit' : 'idle', isSitting);
    }

    // Enforce smooth pairwise separation so characters never stand overlapping each other
    this.applyCharacterSeparation(dt);

    for (const ped of this.pedestrians) {
      ped.rig.group.position.x += ped.dir * ped.speed * dt;
      if (ped.dir === 1 && ped.rig.group.position.x > 22) ped.rig.group.position.x = -22;
      if (ped.dir === -1 && ped.rig.group.position.x < -22) ped.rig.group.position.x = 22;
      ped.rig.mixer.update(dt);
    }
  }
}

function lerpAngle(a: number, b: number, t: number): number {
  let diff = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI;
  if (diff < -Math.PI) diff += Math.PI * 2;
  return a + diff * t;
}
