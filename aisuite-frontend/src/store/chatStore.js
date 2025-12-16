// import { create } from "zustand";
// import API from "../api/axios";
// import log from "../utils/logger";
// import dialog from "../utils/dialogService";
// import { useAuthStore } from "./authStore";

// /**
//  * CHAT STORE
//  * ----------
//  * Single source of truth for:
//  * - Messages
//  * - Conversation history
//  * - Active conversation
//  * - Active AI models
//  * - Selected module (Career / Study / Content)
//  * - Sidebar state
//  *
//  * UI components (ChatWindow, Sidebar, ChatInput, Dashboard)
//  * only READ from here or TRIGGER actions.
//  */

// export const useChatStore = create((set, get) => ({
//   /* =====================================================
//    * STATE
//    * ===================================================== */

//   /** All messages of the active conversation */
//   messages: [],

//   /** Sidebar conversation list */
//   history: [],

//   /** Currently active conversation ID */
//   conversationId: null,

//   /** Selected module (STATIC) */
//   currentModule: "CareerGPT",

//   /** Available AI models (DYNAMIC, from backend) */
//   models: [], // [{ id, name }]

//   /** Active models for current chat */
//   activeModels: [], // ["chatgpt", "gemini"]

//   /** UI flags */
//   loading: false,
//   historyLoading: false,
//   sidebarOpen: true,

//   /* =====================================================
//    * INITIALIZATION
//    * ===================================================== */

//   /**
//    * Load available AI models from backend
//    * - Public endpoint
//    * - Called on app boot / dashboard load
//    * - Enables all models by default
//    */
//   loadModels: async () => {
//     try {
//       const res = await API.get("/admin/system/models");
//       const models = Array.isArray(res.data) ? res.data : [];

//       set({
//         models,
//         activeModels: models.map(m => m.id)
//       });
//     } catch (err) {
//       log("ERROR", "Failed to load models", err);
//       set({ models: [], activeModels: [] });
//     }
//   },

//   /* =====================================================
//    * MODULE CONTROL (STATIC)
//    * ===================================================== */

//   /**
//    * Set active module
//    * Used by ChatInput dropdown
//    */
//   setModule: (module) => {
//     set({ currentModule: module });
//   },

//   /* =====================================================
//    * MESSAGE FLOW
//    * ===================================================== */

//   /**
//    * Send a user message to backend (SmartMix)
//    * Handles:
//    * - Free plan limits
//    * - Model availability
//    * - Message state updates
//    */
//   sendMessage: async (input) => {
//     const {
//       currentModule,
//       conversationId,
//       activeModels,
//       messages
//     } = get();

//     const authStore = useAuthStore.getState();

//     // Safety: no active models
//     if (!activeModels.length) {
//       await dialog.alert(
//         "No AI models are enabled. Please contact the administrator."
//       );
//       return;
//     }

//     // Add user message immediately
//     const userMsg = {
//       role: "user",
//       content: input,
//       timestamp: new Date()
//     };

//     set({ messages: [...messages, userMsg], loading: true });

//     try {
//       // Send to backend
//       const res = await API.post("/smartmix/process", {
//         input,
//         type: currentModule,
//         conversationId,
//         activeModels
//       });

//       const { conversationId: newId, outputs } = res.data;

//       // Pick primary output safely
//       const content =
//         outputs?.[activeModels[0]] ??
//         Object.values(outputs || {})[0] ??
//         "No response";

//       const aiMsg = {
//         role: "assistant",
//         content,
//         individualOutputs: outputs,
//         timestamp: new Date(),
//         animate: true
//       };

//       set({
//         messages: [...messages, userMsg, aiMsg],
//         conversationId: newId,
//         loading: false
//       });

//       // Refresh sidebar history
//       get().fetchHistory();

//       // Update usage for free users
//       if (
//         authStore.subscription === "Free" &&
//         !conversationId
//       ) {
//         authStore.incrementQueryCount?.();
//       }
//     } catch (err) {
//       log("ERROR", "Send message failed", err);
//       set({ loading: false });
//     }
//   },

//   /* =====================================================
//    * HISTORY (SIDEBAR)
//    * ===================================================== */

//   /**
//    * Fetch conversation history for sidebar
//    */
//   fetchHistory: async () => {
//     set({ historyLoading: true });
//     try {
//       const res = await API.get("/auth/getHistory");
//       set({ history: res.data.history || [] });
//     } catch (err) {
//       log("ERROR", "Fetch history failed", err);
//     } finally {
//       set({ historyLoading: false });
//     }
//   },

//   /**
//    * Load a conversation when clicked from sidebar
//    */
//   loadChat: async (id) => {
//     set({ loading: true, conversationId: id, sidebarOpen: false });

//     try {
//       const res = await API.get(`/smartmix/history/${id}`);
//       const { conversation } = res.data;

//       set({
//         messages: conversation.messages.map(m => ({
//           ...m,
//           animate: false
//         })),
//         currentModule: conversation.moduleType,
//         activeModels: get().models.map(m => m.id)
//       });
//     } catch (err) {
//       log("ERROR", "Load chat failed", err);
//     } finally {
//       set({ loading: false });
//     }
//   },

//   /**
//    * Delete a conversation
//    * - Called from Sidebar
//    * - Updates backend + UI state
//    */
//   deleteConversation: async (conversationId) => {
//     try {
//       await API.delete(`/smartmix/history/${conversationId}`);

//       // Remove from sidebar list
//       set(state => ({
//         history: state.history.filter(
//           h => h._id !== conversationId
//         )
//       }));

//       // If deleting active chat → reset state
//       if (get().conversationId === conversationId) {
//         set({
//           messages: [],
//           conversationId: null,
//           currentModule: "CareerGPT",
//           activeModels: get().models.map(m => m.id)
//         });
//       }
//     } catch (err) {
//       log("ERROR", "Delete conversation failed", err);
//     }
//   },

//   /**
//    * Start a brand new chat
//    */
//   startNewChat: () => {
//     set({
//       messages: [],
//       conversationId: null,
//       currentModule: "CareerGPT",
//       activeModels: get().models.map(m => m.id)
//     });
//   },

//   /* =====================================================
//    * MODEL SELECTION (DYNAMIC)
//    * ===================================================== */

//   /**
//    * Switch to single-model mode
//    */
//   selectModel: (id) => {
//     set({ activeModels: [id] });
//   },

//   /**
//    * Enable all models
//    */
//   resetModels: () => {
//     set({ activeModels: get().models.map(m => m.id) });
//   },

//   /* =====================================================
//    * UI
//    * ===================================================== */

//   /**
//    * Toggle sidebar open / close
//    */
//   toggleSidebar: () => {
//     set(state => ({ sidebarOpen: !state.sidebarOpen }));
//   }
// }));

import { create } from "zustand";
import API from "../api/axios";
import log from "../utils/logger";
import dialog from "../utils/dialogService";
import { useAuthStore } from "./authStore";

/**
 * =====================================================
 * CHAT STORE (SINGLE SOURCE OF TRUTH)
 * =====================================================
 * - Normalizes model IDs
 * - Normalizes backend outputs
 * - Centralizes limits
 * - Protects UI from backend drift
 */

/* ---------------- HELPERS ---------------- */

const normalizeModelId = (id) =>
  String(id || "").toLowerCase();

/* ===================================================== */

export const useChatStore = create((set, get) => ({
  /* ---------------- STATE ---------------- */

  messages: [],
  history: [],
  conversationId: null,
  deletedConversationIds: new Set(), 

  currentModule: "CareerGPT",

  models: [],            // [{ id, name }]
  activeModels: [],      // ["gpt-4o", "gemini-1.5"]

  loading: false,
  historyLoading: false,
  sidebarOpen: true,

  limits: {
    dailyFree: 3,
    perChatFree: 10,
  },

  /* ---------------- PERMISSIONS ---------------- */

  canSendMessage: () => {
    const { messages, conversationId } = get();
    const { subscription, user } = useAuthStore.getState();

    if (subscription !== "Free") return true;

    // New conversation daily limit
    if (!conversationId && (user?.dailyQueryCount || 0) >= 3) {
      log("INFO", "Daily free limit reached");
      return false;
    }

    // Per-chat limit
    const userMessages = messages.filter(m => m.role === "user").length;
    if (conversationId && userMessages >= 10) {
      log("INFO", "Per-chat free limit reached");
      return false;
    }

    return true;
  },

  /* ---------------- MODELS ---------------- */

  loadModels: async () => {
    try {
      const res = await API.get("/admin/system/models");
      const models = Array.isArray(res.data) ? res.data : [];

      const normalized = models.map(m => ({
        ...m,
        id: normalizeModelId(m.id),
      }));

      log("INFO", "Models loaded", normalized);

      set({
        models: normalized,
        activeModels: normalized.map(m => m.id),
      });
    } catch (err) {
      log("ERROR", "Failed to load models", err);
      set({ models: [], activeModels: [] });
    }
  },

  selectModel: (id) => {
    log("INFO", "Switching to single model", id);
    set({ activeModels: [normalizeModelId(id)] });
  },

  resetModels: () => {
    log("INFO", "Resetting to all models");
    set({ activeModels: get().models.map(m => m.id) });
  },

  /* ---------------- MODULE ---------------- */

  setModule: (module) => {
    log("INFO", "Module changed", module);
    set({ currentModule: module });
  },

  /* ---------------- MESSAGE FLOW ---------------- */

sendMessage: async (input) => {
  const {
    currentModule,
    conversationId,
    activeModels,
    canSendMessage,
  } = get();

  if (!canSendMessage()) {
    await dialog.alert("You have reached your usage limit.");
    return;
  }

  if (!activeModels.length) {
    await dialog.alert("No AI models enabled.");
    return;
  }

  const userMsg = {
    role: "user",
    content: input,
    timestamp: new Date(),
  };

  // ✅ Always use functional set for messages
  set((state) => ({
    messages: [...state.messages, userMsg],
    loading: true,
  }));

  try {
    const res = await API.post("/smartmix/process", {
      input,
      type: currentModule,
      conversationId,
      activeModels,
    });

    const outputsRaw = res.data?.outputs || {};
    const newConversationId = res.data?.conversationId || conversationId;

    /* =====================================================
     * 🔑 OPTIMISTIC HISTORY INSERT (ONLY ON NEW CHAT)
     * ===================================================== */
    set((state) => {
      if (!newConversationId) return {};

      const exists = state.history.some(
        (h) => (h._id || h.id) === newConversationId
      );

      if (exists) return {};

      return {
        history: [
          {
            _id: newConversationId,
            title: input.slice(0, 40) || "New Conversation",
            moduleType: currentModule,
          },
          ...state.history,
        ],
      };
    });

    // Normalize outputs
    const outputs = Object.fromEntries(
      Object.entries(outputsRaw).map(([k, v]) => [
        normalizeModelId(k),
        typeof v === "string" ? { text: v } : v,
      ])
    );

    const first = Object.values(outputs)[0];
    const content = first?.text || "No response";

    const aiMsg = {
      role: "assistant",
      content,
      individualOutputs: outputs,
      timestamp: new Date(),
      animate: true,
    };

    // ✅ Append AI message safely
    set((state) => ({
      messages: [...state.messages, aiMsg],
      conversationId: newConversationId,
      loading: false,
    }));

    // ❌ DO NOT fetchHistory here (prevents flicker)

    const auth = useAuthStore.getState();
    if (auth.subscription === "Free" && !conversationId) {
      auth.incrementQueryCount?.();
    }

  } catch (err) {
    log("ERROR", "Send message failed", err);
    set({ loading: false });
  }
},


  /* ---------------- HISTORY ---------------- */

fetchHistory: async () => {
  set({ historyLoading: true });

  try {
    const res = await API.get("/auth/getHistory");
    const serverHistory = res.data?.history || [];

    const deleted = get().deletedConversationIds;

    // 🔑 Prevent resurrecting deleted chats
    const cleanHistory = serverHistory.filter(
      (h) => !deleted.has(h._id || h.id)
    );

    set({ history: cleanHistory });
  } catch (err) {
    log("ERROR", "Fetch history failed", err);
  } finally {
    set({ historyLoading: false });
  }
},


  loadChat: async (id) => {
    set({ loading: true, conversationId: id, sidebarOpen: false });

    try {
      const res = await API.get(`/smartmix/history/${id}`);
      const convo = res.data?.conversation;

      set({
        messages: (convo?.messages || []).map(m => ({
          ...m,
          animate: false,
        })),
        currentModule: convo?.moduleType || "CareerGPT",
        activeModels: get().models.map(m => m.id),
      });

    } catch (err) {
      log("ERROR", "Load chat failed", err);
    } finally {
      set({ loading: false });
    }
  },

 deleteConversation: async (id) => {
  try {
    // 🔑 Optimistic UI update + blacklist
    set((state) => {
      const deleted = new Set(state.deletedConversationIds);
      deleted.add(id);

      return {
        deletedConversationIds: deleted,
        history: state.history.filter(
          (h) => (h._id || h.id) !== id
        ),
      };
    });

    // Backend delete
    await API.delete(`/smartmix/history/${id}`);

    // If currently open chat was deleted → reset
    if (get().conversationId === id) {
      get().startNewChat();
    }
  } catch (err) {
    log("ERROR", "Delete conversation failed", err);
  }
},

clearAllHistory: async () => {
  try {
    log("WARN", "Clearing all history");

    await API.delete("/auth/history/clear");

    set({
      history: [],
      messages: [],
      conversationId: null,
      deletedConversationIds: new Set(), // 🔑 reset blacklist
      currentModule: "CareerGPT",
      activeModels: get().models.map(m => m.id),
    });
  } catch (err) {
    log("ERROR", "Clear all history failed", err);
  }
},

resetChatStore: () => {
  set({
    messages: [],
    history: [],
    conversationId: null,
    deletedConversationIds: new Set(),
    currentModule: "CareerGPT",
    activeModels: [],
    loading: false,
    historyLoading: false,
    sidebarOpen: true,
  });
},




  startNewChat: () => {
    log("INFO", "Starting new chat");
    set({
      messages: [],
      conversationId: null,
      currentModule: "CareerGPT",
      activeModels: get().models.map(m => m.id),
    });
  },

  /* ---------------- UI ---------------- */

  toggleSidebar: () => {
    set(s => ({ sidebarOpen: !s.sidebarOpen }));
  },
}));

