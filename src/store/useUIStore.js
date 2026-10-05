import { create } from 'zustand';

export const useUIStore = create((set) => ({
  activeBottomSheet: null, // null | 'cluster' | 'member' | 'meeting_point'
  activeModal: null,       // null | 'emergency' | 'qr' | 'create_point'
  toastMessage: null,

  openBottomSheet: (type) => set({ activeBottomSheet: type }),
  closeBottomSheet: () => set({ activeBottomSheet: null }),
  openModal: (type) => set({ activeModal: type }),
  closeModal: () => set({ activeModal: null }),

  showToast: (message) => {
    set({ toastMessage: message });
    setTimeout(() => {
      set({ toastMessage: null });
    }, 3000);
  },
}));
