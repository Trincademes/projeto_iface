"use client";

import { useEffect, useState } from "react";
import Card from "./components/Card";
import Botao from "./components/Botao";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8080";
const POLL_INTERVAL_MS = Math.max(
  Number(process.env.NEXT_PUBLIC_POLL_INTERVAL_MS ?? 2000),
  1000
);
const DEVICE_STALE_MS = Math.max(
  Number(process.env.NEXT_PUBLIC_DEVICE_STALE_MS ?? 10000),
  1000
);
const RESET_ENABLED = process.env.NEXT_PUBLIC_ALLOW_DEVICE_RESET === "true";

type Device = {
  deviceId: string;
  name: string;
  type: string;
  location: string;
  connected: boolean;
  status: string;
  lastSeen: string;
  sensors: {
    temperature: number | null;
    pressure: number | null;
    humidity: number | null;
    running: boolean | null;
    safetyLock: boolean | null;
  };
};

const getConnectionTone = (connected: boolean) =>
  connected
    ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-100"
    : "border-rose-400/30 bg-rose-400/10 text-rose-100";

const getStatusTone = (status: string) => {
  if (status === "Operando") {
    return "border-cyan-400/30 bg-cyan-400/10 text-cyan-100";
  }

  if (status === "Parado") {
    return "border-amber-400/30 bg-amber-400/10 text-amber-100";
  }

  return "border-slate-300/20 bg-slate-300/10 text-slate-100";
};

const formatBoolean = (value: boolean | null, activeLabel: string, inactiveLabel: string) => {
  if (value === null) {
    return "Sem leitura";
  }

  return value ? activeLabel : inactiveLabel;
};

const formatNumber = (value: number | null, suffix: string) => {
  if (value === null) {
    return "Sem leitura";
  }

  return `${value.toFixed(2)} ${suffix}`;
};

const applyConnectionState = (device: Device): Device => {
  const lastSeenTime = new Date(device.lastSeen).getTime();
  const hasValidTimestamp = Number.isFinite(lastSeenTime);
  const connected = hasValidTimestamp && Date.now() - lastSeenTime <= DEVICE_STALE_MS;

  return {
    ...device,
    connected,
    status: connected ? device.status : "Sem comunicacao",
  };
};

export default function Home() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDevices = async () => {
    try {
      const response = await fetch(`${API_BASE}/devices`);

      if (!response.ok) {
        throw new Error("Nao foi possivel carregar os dispositivos.");
      }

      const responseJson = (await response.json()) as Device[];
      setDevices(responseJson.map(applyConnectionState));
      setError("");
    } catch (loadError) {
      setDevices((currentDevices) => currentDevices.map(applyConnectionState));
      setError("Backend indisponivel ou sem dados chegando do Node-RED.");
      console.error(loadError);
    } finally {
      setLoading(false);
    }
  };

  const clearDevices = async () => {
    if (!RESET_ENABLED) {
      setError("Limpeza desabilitada. Defina NEXT_PUBLIC_ALLOW_DEVICE_RESET=true.");
      return;
    }

    if (!window.confirm("Deseja remover todos os dispositivos em memoria?")) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/destroy`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Falha ao limpar os dispositivos.");
      }

      setDevices([]);
      setError("");
    } catch (clearError) {
      setError("Nao foi possivel limpar os dispositivos.");
      console.error(clearError);
    }
  };

  useEffect(() => {
    loadDevices();

    const intervalId = window.setInterval(() => {
      loadDevices();
    }, POLL_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  const connectedDevices = devices.filter((device) => device.connected).length;
  const staleDevices = devices.length - connectedDevices;

  return (
    <main className="min-h-screen px-4 py-6 text-slate-100 sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <section className="overflow-hidden rounded-[2rem] border border-white/12 bg-slate-950/65 p-5 shadow-[0_30px_100px_rgba(8,15,30,0.55)] backdrop-blur md:p-8">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.9fr)] lg:items-start">
            <div className="relative">
              <div className="absolute -left-12 top-0 h-32 w-32 rounded-full bg-cyan-400/10 blur-3xl" />
              <div className="absolute bottom-0 right-0 h-28 w-28 rounded-full bg-amber-300/10 blur-3xl" />
              <div className="relative">
                <p className="inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-200">
                Supervisao Industrial
                </p>
                <h1 className="mt-4 max-w-3xl text-4xl font-black leading-tight text-white sm:text-5xl">
                  Painel de dispositivos conectado a uma bancada OPC UA
                </h1>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                  O frontend acompanha o backend em ciclos de {POLL_INTERVAL_MS / 1000} segundos
                  e exibe o estado operacional da bancada em uma interface mais legivel para sala
                  de aula, laboratorio e demonstracao.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-[1.75rem] border border-white/10 bg-white/6 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                  Situacao atual
                </p>
                <div className="mt-4 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-4xl font-black text-white">{connectedDevices}</p>
                    <p className="mt-1 text-sm text-slate-300">dispositivos conectados</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-slate-950/50 px-3 py-2 text-right">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">offline</p>
                    <p className="text-lg font-bold text-slate-200">{staleDevices}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-[1.75rem] border border-white/10 bg-white/6 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                  Backend
                </p>
                <p className="mt-4 text-2xl font-black text-white">
                  {error ? "Atencao" : "Online"}
                </p>
                <p className="mt-2 text-sm text-slate-300">
                  {loading ? "Carregando dados iniciais" : `Polling ativo a cada ${POLL_INTERVAL_MS / 1000}s`}
                </p>
              </div>

              {RESET_ENABLED && (
                <div className="rounded-[1.75rem] border border-white/10 bg-white/6 p-5 sm:col-span-2 lg:col-span-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                    Manutencao
                  </p>
                  <p className="mt-3 text-sm leading-6 text-slate-300">
                    Limpe os dispositivos em memoria para reiniciar a demonstracao.
                  </p>
                  <div className="mt-4">
                    <Botao estilo="deletar" onClick={clearDevices} nome="Limpar dados" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {error && (
            <p className="mt-5 rounded-2xl border border-amber-400/30 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">
              {error}
            </p>
          )}
        </section>

        {devices.length === 0 && !loading ? (
          <section className="rounded-[2rem] border border-dashed border-cyan-400/20 bg-slate-950/45 p-8 text-center shadow-[0_18px_60px_rgba(8,15,30,0.3)] sm:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200">
              Sem dados ativos
            </p>
            <h2 className="mt-3 text-3xl font-black text-white">Nenhum dispositivo encontrado</h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
              Inicie o servidor OPC UA, a bridge ou o fluxo do Node-RED e mantenha o backend
              online para que as leituras aparecam automaticamente no painel.
            </p>
            {!RESET_ENABLED && (
              <p className="mt-3 text-xs uppercase tracking-[0.18em] text-slate-500">
                A limpeza remota esta desabilitada por padrao.
              </p>
            )}
          </section>
        ) : (
          <section className="grid gap-5 sm:gap-6 md:grid-cols-2 2xl:grid-cols-3">
            {devices.map((device) => (
              <Card key={device.deviceId} size="sm" style="white" className="overflow-hidden">
                <div className="mt-1 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                      Dispositivo
                    </p>
                    <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
                      {device.name}
                    </h2>
                  </div>

                  <span
                    className={`rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] ${getConnectionTone(device.connected)}`}
                  >
                    {device.connected ? "Online" : "Offline"}
                  </span>
                </div>

                <div className="mt-5 flex flex-col gap-4 text-sm">
                  <div className="rounded-[1.5rem] border border-slate-200 bg-white/80 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-slate-500">Identificacao</p>
                        <p className="mt-1 font-semibold text-slate-900">{device.deviceId}</p>
                      </div>

                      <span
                        className={`rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] ${getStatusTone(device.status)}`}
                      >
                        {device.status}
                      </span>
                    </div>

                    <p className="mt-3 text-slate-700">{device.type}</p>
                    <p className="text-slate-500">{device.location}</p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-[1.5rem] bg-slate-950 p-4 text-slate-50">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Conexao</p>
                      <p className="mt-2 text-lg font-bold">
                        {device.connected ? "Conectado" : "Sem comunicacao"}
                      </p>
                    </div>

                    <div className="rounded-[1.5rem] bg-cyan-50 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Ultima leitura</p>
                      <p className="mt-2 text-sm font-bold text-slate-900">
                        {new Date(device.lastSeen).toLocaleString("pt-BR")}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-[1.5rem] bg-slate-100 p-4">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Sensores
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl bg-white p-4">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Temperatura</p>
                        <p className="mt-2 text-lg font-bold text-slate-950">
                          {formatNumber(device.sensors.temperature, "C")}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-white p-4">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Pressao</p>
                        <p className="mt-2 text-lg font-bold text-slate-950">
                          {formatNumber(device.sensors.pressure, "bar")}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-white p-4">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Umidade</p>
                        <p className="mt-2 text-lg font-bold text-slate-950">
                          {formatNumber(device.sensors.humidity, "%")}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-white p-4">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Operacao</p>
                        <p className="mt-2 text-lg font-bold text-slate-950">
                          {formatBoolean(device.sensors.running, "Ligado", "Desligado")}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-white p-4 sm:col-span-2">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Trava de seguranca</p>
                        <p className="mt-2 text-lg font-bold text-slate-950">
                          {formatBoolean(device.sensors.safetyLock, "Segura", "Liberada")}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
