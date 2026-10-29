import React, { useEffect, useState } from "react";

import {
  Menu,
  Moon,
  Sun,
  Search,
  Server,
  User as UserIcon,
  LogOut,
  Sparkles,
  ShieldAlert,
  ChevronDown,
  Lock,
  LayoutDashboard,
  Bell,
  CheckCheck,
  X,
} from "lucide-react";

import { User, ApiConfig } from "../types";

const USER_PHOTO_BASE = "https://sothink.com.br/app/uploads/usuarios";

const getUserPhotoUrl = (value?: string | null) => {
  const photo = String(value || "").trim();

  if (!photo) return "";

  if (/^(?:https?:|data:|blob:)/i.test(photo)) return photo;

  const filename = photo.split("/").pop() || photo;

  return `${USER_PHOTO_BASE}/${encodeURIComponent(filename)}`;
};

interface NotificationItem {
  id?: number | string;
  chave_evento?: string;
  chave_leitura?: string;
  usuario_id?: string;
  tipo: string;
  titulo: string;
  mensagem?: string;
  quadro?: string;
  referencia_tipo?: string;
  referencia_id?: string;
  lida: boolean;
  data_criacao?: string;
  data_evento?: string;
  data_leitura?: string | null;
}

const NOTIFICATIONS_API = "https://sothink.com.br/app/api/notificacoes";

interface HeaderProps {
  currentUser?: User | null;

  onToggleSidebar?: () => void;

  darkMode?: boolean;

  onToggleDarkMode?: () => void;

  theme?: "light" | "dark";

  onToggleTheme?: () => void;

  apiConfig?: ApiConfig;

  onOpenApiConfig?: () => void;

  onLogout?: () => void;

  onOpenLoginModal?: () => void;

  searchQuery?: string;

  onSearchChange?: (q: string) => void;

  onSwitchRole?: (role: "admin" | "cliente") => void;

  activeTabTitle?: string;

  showToast?: (
    type: "success" | "error" | "info",

    title: string,

    desc?: string,
  ) => void;

  // Novas propriedades para o botão Voltar ao Dashboard

  isDashboard?: boolean;

  onBackToDashboard?: () => void;

  onNavigateNotification?: (
    notification: NotificationItem,
  ) => void | Promise<void>;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,

  onToggleSidebar,

  darkMode,

  onToggleDarkMode,

  theme,

  onToggleTheme,

  apiConfig,

  onOpenApiConfig,

  onLogout,

  onOpenLoginModal,

  searchQuery = "",

  onSearchChange,

  onSwitchRole,

  activeTabTitle = "Controle de Jobs",

  isDashboard,

  onBackToDashboard,

  onNavigateNotification,
}) => {
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const [userPhotoUrl, setUserPhotoUrl] = useState("");

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationsModalOpen, setNotificationsModalOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [allNotifications, setAllNotifications] = useState<NotificationItem[]>(
    [],
  );
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(false);

  const currentUserAny = currentUser as any;

  const currentUserId = String(currentUserAny?.id || "").trim();

  useEffect(() => {
    let mounted = true;

    const localPhoto = getUserPhotoUrl(
      currentUserAny?.foto_perfil || currentUserAny?.avatar,
    );

    setUserPhotoUrl(localPhoto);

    const loadCurrentUserPhoto = async () => {
      if (!currentUser) return;

      try {
        const response = await fetch(
          "https://sothink.com.br/app/api/listar?tabela=usuarios",

          { cache: "no-store" },
        );

        const data = await response.json();

        const usuarios = Array.isArray(data)
          ? data
          : Array.isArray(data?.dados)
            ? data.dados
            : Array.isArray(data?.data)
              ? data.data
              : [];

        const userId = String(currentUserAny?.id || "").trim();

        const email = String(currentUserAny?.email || "")
          .trim()

          .toLowerCase();

        const usuarioLogin = String(currentUserAny?.usuario || "")
          .trim()

          .toLowerCase();

        const usuarioBanco = usuarios.find((item: any) => {
          if (userId && String(item?.id || "") === userId) return true;

          if (
            email &&
            String(item?.email || "")
              .trim()

              .toLowerCase() === email
          )
            return true;

          if (
            usuarioLogin &&
            String(item?.usuario || "")
              .trim()

              .toLowerCase() === usuarioLogin
          ) {
            return true;
          }

          return false;
        });

        const photo = getUserPhotoUrl(usuarioBanco?.foto_perfil);

        if (mounted && photo) setUserPhotoUrl(photo);
      } catch (error) {
        console.error("Erro ao carregar foto do usuário no Header:", error);
      }
    };

    const handlePhotoUpdated = (event: Event) => {
      const detail = (event as CustomEvent<any>)?.detail || {};

      const currentId = String(currentUserAny?.id || "");

      if (currentId && String(detail?.userId || "") !== currentId) return;

      const photo = getUserPhotoUrl(detail?.url || detail?.foto_perfil);

      setUserPhotoUrl(photo);
    };

    loadCurrentUserPhoto();

    window.addEventListener(
      "sothink:user-photo-updated",

      handlePhotoUpdated as EventListener,
    );

    return () => {
      mounted = false;

      window.removeEventListener(
        "sothink:user-photo-updated",

        handlePhotoUpdated as EventListener,
      );
    };
  }, [
    currentUserAny?.id,

    currentUserAny?.email,

    currentUserAny?.usuario,

    currentUserAny?.foto_perfil,

    currentUserAny?.avatar,
  ]);

  const loadNotifications = async (silent = false, loadAll = false) => {
    if (!currentUserId) {
      setNotifications([]);
      setAllNotifications([]);
      setUnreadNotifications(0);
      return;
    }

    if (!silent) setNotificationsLoading(true);

    try {
      const limit = loadAll ? 100 : 10;

      const response = await fetch(
        `${NOTIFICATIONS_API}?action=list&usuario_id=${encodeURIComponent(
          currentUserId,
        )}&limit=${limit}${loadAll ? "&all=1" : ""}`,
        { cache: "no-store" },
      );

      const data = await response.json();

      if (!response.ok || data?.sucesso === false) {
        throw new Error(
          data?.erro || "Não foi possível carregar notificações.",
        );
      }

      const items = Array.isArray(data?.dados) ? data.dados : [];

      if (loadAll) {
        setAllNotifications(items);
      } else {
        setNotifications(items.slice(0, 10));
      }

      setUnreadNotifications(Number(data?.nao_lidas || 0));
    } catch (error) {
      console.error("Erro ao carregar notificações:", error);
    } finally {
      if (!silent) setNotificationsLoading(false);
    }
  };

  useEffect(() => {
    if (!currentUserId) {
      setNotifications([]);

      setUnreadNotifications(0);

      setNotificationsOpen(false);
      setNotificationsModalOpen(false);

      return;
    }

    loadNotifications(false, false);

    const intervalId = window.setInterval(() => {
      loadNotifications(true, false);
    }, 20000);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        loadNotifications(true, false);
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.clearInterval(intervalId);

      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [currentUserId]);

  const markNotificationAsRead = async (notification: NotificationItem) => {
    if (!currentUserId || notification.lida) return;

    const form = new FormData();

    form.append("action", "mark_read");
    form.append("usuario_id", currentUserId);

    if (notification.id !== undefined && notification.id !== null) {
      form.append("id", String(notification.id));
    }

    const eventKey =
      notification.chave_leitura || notification.chave_evento || "";

    if (eventKey) {
      form.append("chave_evento", eventKey);
    }

    try {
      const response = await fetch(NOTIFICATIONS_API, {
        method: "POST",
        body: form,
      });

      const data = await response.json();

      if (!response.ok || data?.sucesso === false) {
        throw new Error(data?.erro || "Não foi possível marcar como lida.");
      }

      const sameNotification = (item: NotificationItem) => {
        if (
          notification.id !== undefined &&
          notification.id !== null &&
          item.id !== undefined &&
          item.id !== null
        ) {
          return String(item.id) === String(notification.id);
        }

        return (
          String(item.chave_evento || "") ===
          String(notification.chave_evento || "")
        );
      };

      setNotifications((previous) =>
        previous.map((item) =>
          sameNotification(item) ? { ...item, lida: true } : item,
        ),
      );

      setAllNotifications((previous) =>
        previous.map((item) =>
          sameNotification(item) ? { ...item, lida: true } : item,
        ),
      );

      setUnreadNotifications((previous) => Math.max(0, previous - 1));
    } catch (error) {
      console.error("Erro ao marcar notificação como lida:", error);
    }
  };

  const handleNotificationClick = async (notification: NotificationItem) => {
    await markNotificationAsRead(notification);

    setNotificationsOpen(false);
    setNotificationsModalOpen(false);

    if (onNavigateNotification) {
      await onNavigateNotification(notification);
    }
  };

  const openAllNotifications = async () => {
    setNotificationsOpen(false);
    setNotificationsModalOpen(true);
    await loadNotifications(false, true);
  };

  const markAllNotificationsAsRead = async () => {
    if (!currentUserId || unreadNotifications <= 0) return;

    const form = new FormData();

    form.append("action", "mark_all");

    form.append("usuario_id", currentUserId);

    try {
      const response = await fetch(NOTIFICATIONS_API, {
        method: "POST",

        body: form,
      });

      const data = await response.json();

      if (!response.ok || data?.sucesso === false) {
        throw new Error(
          data?.erro || "Não foi possível marcar todas como lidas.",
        );
      }

      setNotifications((previous) =>
        previous.map((item) => ({ ...item, lida: true })),
      );

      setAllNotifications((previous) =>
        previous.map((item) => ({ ...item, lida: true })),
      );
      setUnreadNotifications(0);
    } catch (error) {
      console.error("Erro ao marcar notificações como lidas:", error);
    }
  };

  const formatNotificationDate = (value?: string) => {
    if (!value) return "";

    const normalized = value.includes("T") ? value : value.replace(" ", "T");

    const date = new Date(normalized);

    if (Number.isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",

      month: "2-digit",

      hour: "2-digit",

      minute: "2-digit",
    }).format(date);
  };

  const isDark = theme ? theme === "dark" : Boolean(darkMode);

  const handleToggleTheme = onToggleTheme || onToggleDarkMode || (() => {});

  const handleLogout = onLogout || onOpenLoginModal || (() => {});

  // Identifica se está no dashboard pela prop isDashboard ou pelo título da aba

  const currentlyOnDashboard =
    isDashboard ??
    (activeTabTitle === "Dashboard" ||
      activeTabTitle === "Painel Administrativo");

  const getInitials = (name?: string) => {
    if (!name) return "AD";

    const parts = name.trim().split(" ");

    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }

    return name.substring(0, 2).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 lg:px-8 flex items-center justify-between transition-colors shadow-xs">
      {/* Left section: Breadcrumb & Sidebar Toggle */}

      <div className="flex items-center gap-3 w-1/3">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Alternar Menu Lateral"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="hidden sm:flex items-center gap-2">
          {/* <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-xs shadow-xs">



            S



          </div> */}

          <div className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <span className="font-bold text-slate-800 dark:text-slate-200">
              STK
            </span>

            <span>/</span>

            <span className="text-slate-600 dark:text-slate-300 font-semibold">
              {activeTabTitle}
            </span>
          </div>
        </div>
      </div>

      {/* Center section: Back to Dashboard & Search Bar */}

      <div className="flex-1 flex items-center justify-center gap-4">
        {!currentlyOnDashboard && onBackToDashboard && (
          <button
            onClick={onBackToDashboard}
            className="flex items-center cursor-pointer gap-2 px-4 py-1.5 bg-slate-800 dark:bg-slate-100 hover:bg-slate-700 dark:hover:bg-white text-white dark:text-slate-900 rounded-lg text-xs font-bold transition-all shadow-md active:scale-95 whitespace-nowrap"
          >
            <LayoutDashboard className="w-4 h-4" />

            <span className="hidden sm:inline">Voltar ao Dashboard</span>

            <span className="sm:hidden">Dashboard</span>
          </button>
        )}

        {onSearchChange && (
          <div className="hidden md:flex relative w-full max-w-sm">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />

            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar clientes, jobs ou atas..."
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 dark:text-slate-100 placeholder:text-slate-400 transition-all"
            />
          </div>
        )}
      </div>

      {/* Right Section: Actions & User Profile */}

      <div className="flex items-center justify-end gap-2 sm:gap-3 w-1/3">
        {/* PHP API Status indicator */}

        {onOpenApiConfig && (
          <button
            onClick={onOpenApiConfig}
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              apiConfig?.useRemoteApi
                ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-300"
            }`}
            title="Status da API REST PHP"
          >
            <Server className="w-3.5 h-3.5 text-blue-600" />

            <span>{apiConfig?.useRemoteApi ? "API PHP" : "Local REST"}</span>

            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </button>
        )}

        {/* Notificações do usuário logado */}

        {currentUserId && (
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setNotificationsOpen((previous) => !previous);

                setUserMenuOpen(false);

                if (!notificationsOpen) {
                  loadNotifications(true, false);
                }
              }}
              className="relative p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-all"
              title="Notificações"
            >
              <Bell className="w-4 h-4" />

              {unreadNotifications > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-white text-[9px] font-black flex items-center justify-center border-2 border-white dark:border-slate-900">
                  {unreadNotifications > 99 ? "99+" : unreadNotifications}
                </span>
              )}
            </button>

            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-[min(92vw,380px)] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-black text-slate-900 dark:text-white">
                      Notificações
                    </p>

                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Últimas 10 coisas vinculadas a você
                    </p>
                  </div>

                  {unreadNotifications > 0 && (
                    <button
                      type="button"
                      onClick={markAllNotificationsAsRead}
                      className="inline-flex items-center gap-1.5 text-[10px] font-extrabold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-lg px-2 py-1.5 transition-colors"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      Marcar todas
                    </button>
                  )}
                </div>

                <div className="max-h-[420px] overflow-y-auto">
                  {notificationsLoading ? (
                    <div className="px-4 py-10 text-center text-xs text-slate-400">
                      Carregando notificações...
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="px-4 py-10 text-center">
                      <Bell className="w-7 h-7 mx-auto text-slate-300 dark:text-slate-700 mb-2" />

                      <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                        Nenhuma notificação
                      </p>
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <button
                        type="button"
                        key={String(
                          notification.id ??
                            notification.chave_evento ??
                            notification.referencia_id,
                        )}
                        onClick={() => handleNotificationClick(notification)}
                        className={`w-full text-left px-4 py-3 border-b border-slate-100 dark:border-slate-800 last:border-b-0 transition-colors ${
                          notification.lida
                            ? "bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/70"
                            : "bg-blue-50/70 dark:bg-blue-950/20 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span
                            className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${
                              notification.lida
                                ? "bg-slate-300 dark:bg-slate-700"
                                : "bg-blue-600"
                            }`}
                          />

                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-extrabold text-slate-900 dark:text-slate-100">
                              {notification.titulo}
                            </p>

                            {notification.mensagem && (
                              <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                                {notification.mensagem}
                              </p>
                            )}

                            <div className="flex items-center gap-2 mt-2 text-[9px] font-semibold uppercase tracking-wide text-slate-400">
                              {notification.quadro && (
                                <span>{notification.quadro}</span>
                              )}

                              <span>
                                {formatNotificationDate(
                                  notification.data_evento ||
                                    notification.data_criacao,
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>

                <div className="p-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60">
                  <button
                    type="button"
                    onClick={openAllNotifications}
                    className="w-full px-3 py-2 rounded-xl text-xs font-extrabold text-blue-600 dark:text-blue-400 hover:bg-blue-100/60 dark:hover:bg-blue-950/40 transition-colors"
                  >
                    Ver todas
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Theme Toggle */}

        <button
          onClick={handleToggleTheme}
          className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-all"
          title={isDark ? "Ativar Modo Claro" : "Ativar Modo Escuro"}
        >
          {isDark ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-600" />
          )}
        </button>

        {/* User Profile Pill */}

        <div className="relative">
          <button
            onClick={() => {
              setUserMenuOpen(!userMenuOpen);

              setNotificationsOpen(false);
            }}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border border-slate-200 dark:border-slate-800"
          >
            <div className="relative w-7 h-7 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold text-xs ring-2 ring-blue-500/20">
              {getInitials(currentUser?.nome)}

              {userPhotoUrl && (
                <img
                  src={userPhotoUrl}
                  alt={currentUser?.nome || "Usuário"}
                  className="absolute inset-0 w-full h-full object-cover"
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                />
              )}
            </div>

            <div className="hidden lg:block text-left pr-1">
              <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate max-w-[120px]">
                {currentUser?.nome || "Agência Sothink"}
              </div>

              <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[120px]">
                {currentUser?.role === "cliente"
                  ? "Cliente Portal"
                  : currentUser?.cargo || "Admin"}
              </div>
            </div>

            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* User Dropdown */}

          {userMenuOpen && (
            <div
              className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-2 z-50 animate-in fade-in slide-in-from-top-2"
              onClick={() => setUserMenuOpen(false)}
            >
              <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  {currentUser?.nome || "Agência Sothink"}
                </p>

                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {currentUser?.email || "sothink.gestao@gmail.com"}
                </p>
              </div>

              <div className="p-1.5 space-y-1">
                {onSwitchRole && (
                  <button
                    onClick={() =>
                      onSwitchRole(
                        currentUser?.role === "admin" ? "cliente" : "admin",
                      )
                    }
                    className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                  >
                    <Sparkles className="w-4 h-4 text-blue-600" />

                    {currentUser?.role === "admin"
                      ? "Visão do Cliente"
                      : "Modo Admin"}
                  </button>
                )}

                {onOpenApiConfig && (
                  <button
                    onClick={onOpenApiConfig}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                  >
                    <Server className="w-4 h-4 text-blue-600" />
                    Endpoint API PHP
                  </button>
                )}
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800 p-1.5">
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Trocar Usuário / Sair
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {notificationsModalOpen && (
        <div
          className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setNotificationsModalOpen(false);
            }
          }}
        >
          <div className="w-full max-w-3xl max-h-[88vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-black text-slate-900 dark:text-white">
                  Todas as notificações
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Clique em uma notificação para abrir o quadro correspondente.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setNotificationsModalOpen(false)}
                className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto">
              {notificationsLoading ? (
                <div className="px-5 py-16 text-center text-sm text-slate-400">
                  Carregando notificações...
                </div>
              ) : allNotifications.length === 0 ? (
                <div className="px-5 py-16 text-center text-sm font-bold text-slate-400">
                  Nenhuma notificação encontrada
                </div>
              ) : (
                allNotifications.map((notification) => (
                  <button
                    type="button"
                    key={`all-${String(
                      notification.id ??
                        notification.chave_evento ??
                        notification.referencia_id,
                    )}`}
                    onClick={() => handleNotificationClick(notification)}
                    className={`w-full text-left px-5 py-4 border-b border-slate-100 dark:border-slate-800 last:border-b-0 transition-colors ${
                      notification.lida
                        ? "bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/70"
                        : "bg-blue-50/70 dark:bg-blue-950/20 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${
                          notification.lida
                            ? "bg-slate-300 dark:bg-slate-700"
                            : "bg-blue-600"
                        }`}
                      />

                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                          {notification.titulo}
                        </p>

                        {notification.mensagem && (
                          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                            {notification.mensagem}
                          </p>
                        )}

                        <div className="flex items-center gap-2 mt-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                          {notification.quadro && (
                            <span>{notification.quadro}</span>
                          )}
                          <span>
                            {formatNotificationDate(
                              notification.data_evento ||
                                notification.data_criacao,
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
