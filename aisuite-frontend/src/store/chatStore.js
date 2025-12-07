


import { create } from "zustand";
import API from "../api/axios";
import { useAuthStore } from "./authStore"; // ✅ Import Auth Store

export const useChatStore = create((set, get) => ({
  // ---------------- STATE ----------------
  messages: [],          
  history: [],           
  conversationId: null,  
  currentModule: "CareerGPT", 
  activeModels: ['chatGPT', 'gemini', 'claude'], 

  loading: false,        
  historyLoading: false, 
  sidebarOpen: true,     

  // ---------------- ACTIONS ----------------

  sendMessage: async (input) => {
    const { currentModule, conversationId, activeModels, messages } = get();
    
    // ✅ Access Auth Store State
    const authStore = useAuthStore.getState(); 
    const isFreeUser = authStore.subscription === "Free";
    const isNewChat = !conversationId;

    // 1. Optimistic Limit Check (Optional, UI usually handles this)
    if (isFreeUser && isNewChat && authStore.dailyQueryCount >= 3) {
       return; // Stop request if limit reached
    }

    // Add user message to UI
    const tempUserMsg = { role: "user", content: input, timestamp: new Date() };
    set({ messages: [...messages, tempUserMsg], loading: true });

    try {
      const res = await API.post("/smartmix/process", {
        input,
        type: currentModule,
        conversationId,
        activeModels
      });

      const { conversationId: newId, outputs } = res.data;

      const aiMsg = { 
        role: "assistant", 
        content: outputs.gemini || Object.values(outputs)[0], 
        individualOutputs: outputs,
        timestamp: new Date(),
        animate: true 
      };

      set({ 
        messages: [...messages, tempUserMsg, aiMsg], 
        conversationId: newId, 
        loading: false 
      });

      // 🟢 2. INSTANTLY UPDATE SIDEBAR COUNTER
      // If it was a new chat and user is Free, increment the UI counter immediately
      if (isFreeUser && isNewChat) {
        authStore.incrementQueryCount();
      }

      get().fetchHistory(); // Refresh history list order

    } catch (err) {
      console.error("Failed to send message:", err);
      set({ loading: false });
    }
  },

  fetchHistory: async () => {
    set({ historyLoading: true });
    try {
      const res = await API.get("/auth/getHistory");
      set({ history: res.data.history || [] });
    } catch (err) {
      console.error("Failed to fetch history:", err);
    } finally {
      set({ historyLoading: false });
    }
  },

  loadChat: async (id) => {
    set({ loading: true, conversationId: id, sidebarOpen: false }); 
    try {
      const res = await API.get(`/smartmix/history/${id}`);
      const { conversation } = res.data;
      
      const cleanMessages = conversation.messages.map(msg => ({
        ...msg,
        animate: false 
      }));

      set({ 
        messages: cleanMessages, 
        currentModule: conversation.moduleType 
      });
    } catch (err) {
      console.error("Failed to load chat:", err);
    } finally {
      set({ loading: false });
    }
  },

  // DELETE ACTION
  deleteChat: async (id) => {
    try {
      await API.delete(`/smartmix/history/${id}`);

      set((state) => {
        const newHistory = state.history.filter((chat) => chat.id !== id);
        const isCurrentChat = state.conversationId === id;
        
        return {
          history: newHistory,
          messages: isCurrentChat ? [] : state.messages,
          conversationId: isCurrentChat ? null : state.conversationId
        };
      });
    } catch (err) {
      console.error("Failed to delete chat:", err);
      alert("Failed to delete chat");
    }
  },

  startNewChat: () => {
    set({ 
      messages: [], 
      conversationId: null, 
      currentModule: "CareerGPT" 
    });
  },

  toggleModel: (modelKey) => {
    const { activeModels } = get();
    if (activeModels.includes(modelKey)) {
      if (activeModels.length > 1) {
        set({ activeModels: activeModels.filter(m => m !== modelKey) });
      }
    } else {
      set({ activeModels: [...activeModels, modelKey] });
    }
  },

  setModule: (module) => set({ currentModule: module }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}));