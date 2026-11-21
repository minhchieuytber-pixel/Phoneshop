type EventCallback<T = unknown> = (payload: T) => void;

class EventBus {
  private listeners = new Map<string, Set<EventCallback<unknown>>>();

  on<T = unknown>(event: string, cb: EventCallback<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    const set = this.listeners.get(event)!;
    set.add(cb as EventCallback<unknown>);
    return () => {
      set.delete(cb as EventCallback<unknown>);
    };
  }

  emit<T = unknown>(event: string, payload?: T): void {
    const set = this.listeners.get(event);
    if (!set) return;
    set.forEach((cb) => cb(payload));
  }
}

export const eventBus = new EventBus();
