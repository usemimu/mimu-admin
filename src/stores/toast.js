import { defineStore } from 'pinia'

let nextId = 1

export const useToastStore = defineStore('toast', {
  state: () => ({ items: [] }),
  actions: {
    push({ message, kind = 'info', duration = 4000 }) {
      const id = nextId++
      this.items.push({ id, message, kind })
      if (duration > 0) setTimeout(() => this.dismiss(id), duration)
      return id
    },
    success(message, opts) {
      return this.push({ ...opts, message, kind: 'success' })
    },
    error(message, opts) {
      return this.push({ ...opts, message, kind: 'error', duration: 6000 })
    },
    dismiss(id) {
      this.items = this.items.filter((t) => t.id !== id)
    },
  },
})
