import React, { useState } from "react";
import {
  Lock,
  User,
  Building2,
  Sparkles,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { apiService } from "../services/apiService";
import { User as UserType, EmpresaCliente } from "../types";

interface LoginModalProps {
  onLoginSuccess: (
    user: UserType,
    clientPortalObj?: EmpresaCliente | null
  ) => void;
  showToast: (
    type: "success" | "error" | "info",
    title: string,
    desc?: string
  ) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  onLoginSuccess,
  showToast,
}) => {
  const [activeTab, setActiveTab] = useState<"agencia" | "cliente">("agencia");
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuario || !senha) {
      setErrorMessage("Preencha usuário e senha");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const form = new FormData();

      form.append("usuario", usuario);
      form.append("senha", senha);

      const response = await fetch("https://sothink.com.br/app/api/login", {
        method: "POST",
        body: form,
      });

      const data = await response.json();
      
      if (data.success) {
        showToast(
          "success",
          "Acesso Autorizado!",
          `Bem-vindo, ${data.user.nome}`
        );

        onLoginSuccess(data.user, data.clientPortalObj);
      } else {
        setErrorMessage(data.message || "Usuário ou senha incorretos.");
      }
    } catch (err: any) {
      setErrorMessage("Erro de conexão com a API PHP.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-8 shadow-2xl space-y-6 animate-in zoom-in-95">
        {/* Logo Branding */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600 font-black text-white text-2xl flex items-center justify-center mx-auto shadow-xl shadow-indigo-600/30">
            S
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Agência Sothink
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Sistema de Gestão & CRM Integrado via API PHP
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl text-xs font-extrabold">
          <button
            type="button"
            onClick={() => {
              setActiveTab("agencia");
              setErrorMessage("");
              setUsuario("admin");
              setSenha("123456");
            }}
            className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "agencia"
                ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Equipe Agência
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("cliente");
              setErrorMessage("");
              setUsuario("techprime");
              setSenha("sothink2026");
            }}
            className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "cliente"
                ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <Building2 className="w-4 h-4" />
            Portal do Cliente
          </button>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-300 font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {errorMessage}
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Usuário / E-mail *
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                name="usuario"
                required
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                placeholder={activeTab === "agencia" ? "admin" : "techprime"}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/40 text-slate-900 dark:text-slate-100 font-semibold"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Senha de Acesso *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                name="senha"
                required
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/40 text-slate-900 dark:text-slate-100 font-semibold"
              />
            </div>
          </div>

          <div className="p-3 bg-indigo-50/60 dark:bg-indigo-950/40 rounded-xl border border-indigo-100 dark:border-indigo-900/40 text-[11px] text-indigo-900 dark:text-indigo-200">
            {activeTab === "agencia" ? (
              <p>
                💡 <strong>Demo Agência:</strong> Usuário:{" "}
                <code className="font-mono font-bold">admin</code> | Senha:{" "}
                <code className="font-mono font-bold">123456</code>
              </p>
            ) : (
              <p>
                💡 <strong>Demo Portal Cliente:</strong> Usuário:{" "}
                <code className="font-mono font-bold">techprime</code> | Senha:{" "}
                <code className="font-mono font-bold">sothink2026</code>
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all active:scale-98"
          >
            {loading ? (
              "Autenticando via API..."
            ) : (
              <>
                Acessar o Sistema <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
