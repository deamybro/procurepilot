"use client";

import {
  Activity,
  ArrowRight,
  BadgeCheck,
  Blocks,
  Bot,
  Box,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  Code2,
  Database,
  Download,
  FileCheck2,
  FileText,
  Gauge,
  Globe2,
  History,
  KeyRound,
  LayoutDashboard,
  LockKeyhole,
  Menu,
  Network,
  OctagonAlert,
  Play,
  Plus,
  RefreshCw,
  Search,
  ServerCog,
  ShieldCheck,
  Sparkles,
  Star,
  Store,
  WalletCards,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import type { ProcurementPlan, Provider } from "@/src/domain/models";
import type { IntegrationStatus } from "@/src/integrations/status";
import { DEMO_SCENARIOS } from "@/src/providers/scenarios";
import { BUILT_IN_PROVIDERS } from "@/src/providers/seeds";
import styles from "./procurepilot-dashboard.module.css";

type View =
  | "overview"
  | "new-task"
  | "runs"
  | "market"
  | "providers"
  | "payments"
  | "reputation"
  | "audit"
  | "integrations"
  | "docs";

interface NavItem {
  id: View;
  label: string;
  icon: LucideIcon;
}

interface PlanResponse {
  plannerLabel: string;
  simulated: boolean;
  plan: ProcurementPlan;
  providers: Provider[];
}

interface PaymentRow {
  id: string;
  provider: string;
  amount: string;
  status: "SETTLED" | "BLOCKED";
  proof: string;
}

const NAV: NavItem[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "new-task", label: "New Task", icon: Plus },
  { id: "runs", label: "Task Runs", icon: Activity },
  { id: "market", label: "Provider Market", icon: Store },
  { id: "providers", label: "Providers", icon: Blocks },
  { id: "payments", label: "Payments", icon: WalletCards },
  { id: "reputation", label: "Reputation", icon: Star },
  { id: "audit", label: "Audit Trail", icon: History },
  { id: "integrations", label: "Integrations", icon: ServerCog },
  { id: "docs", label: "Documentation", icon: FileText },
];

const TIMELINE = [
  ["Goal parsed", "Request normalised and constraints locked"],
  ["Providers discovered", "5 local profiles matched against capabilities"],
  ["Quotes received", "Price, reputation, reliability and speed compared"],
  ["Plan approved", "User approval bound to canonical payment details"],
  ["Payment created", "Labelled mock x402 order created"],
  ["Authorization signed", "Simulated authorization — no wallet used"],
  ["Payment transferred", "Simulated settlement proof recorded"],
  ["Provider running", "Built-in provider executing deterministic task"],
  ["Output received", "Untrusted provider result isolated"],
  ["Validation completed", "Schema and claim checks passed"],
  ["Feedback prepared", "Local feedback only; no on-chain submission"],
  ["Final result assembled", "Validated outputs combined into one deliverable"],
] as const;

const STATIC_INTEGRATIONS: IntegrationStatus[] = [
  {
    id: "gemini",
    label: "Gemini AI",
    state: "NOT_CONFIGURED",
    detail: "Scripted planner remains available.",
  },
  {
    id: "scripted",
    label: "Scripted planner",
    state: "WORKING",
    detail: "Deterministic local planning.",
  },
  {
    id: "agentkit",
    label: "GOAT AgentKit",
    state: "WORKING",
    detail: "0.2.3 — official action factories mapped.",
  },
  {
    id: "x402",
    label: "x402 payer",
    state: "DEMO_ONLY",
    detail: "Five official actions installed; no wallet configured.",
  },
  {
    id: "erc8004",
    label: "ERC-8004",
    state: "NOT_CONFIGURED",
    detail: "Profiles remain local and unverified.",
  },
  {
    id: "storage",
    label: "Storage",
    state: "DEMO_ONLY",
    detail: "Persistent only in this browser.",
  },
];

function money(value: string) {
  return Number(value).toFixed(2);
}

function shortAddress(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function StatusPill({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "green" | "amber" | "red" | "gold";
}) {
  return <span className={`${styles.pill} ${styles[tone]}`}>{children}</span>;
}

function SectionTitle({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className={styles.sectionTitle}>
      <div>
        <span className={styles.eyebrow}>{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </div>
  );
}

export function ProcurePilotDashboard() {
  const shellRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<View>("overview");
  const [mobileNav, setMobileNav] = useState(false);
  const [goal, setGoal] = useState(DEMO_SCENARIOS[0].prompt);
  const [budget, setBudget] = useState("5.00");
  const [planner, setPlanner] = useState<"scripted" | "gemini">("scripted");
  const [planning, setPlanning] = useState(false);
  const [planResult, setPlanResult] = useState<PlanResponse | null>(null);
  const [approved, setApproved] = useState(false);
  const [running, setRunning] = useState(false);
  const [timelineIndex, setTimelineIndex] = useState(-1);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [auditEvents, setAuditEvents] = useState<string[]>([
    "Demo workspace initialised",
    "Built-in provider registry loaded",
    "Payment guard enabled",
  ]);
  const [integrations, setIntegrations] =
    useState<IntegrationStatus[]>(STATIC_INTEGRATIONS);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [completedRuns, setCompletedRuns] = useState(3);

  useEffect(() => {
    shellRef.current?.setAttribute("data-hydrated", "true");
    fetch("/api/integrations/status")
      .then((response) => response.json())
      .then((payload) => {
        const parsed = payload as {
          ok?: boolean;
          data?: IntegrationStatus[];
        };
        if (parsed.ok && parsed.data) setIntegrations(parsed.data);
      })
      .catch(() => undefined);
  }, []);

  const overBudget = useMemo(
    () =>
      planResult
        ? Number(planResult.plan.estimatedTotal) > Number(budget)
        : false,
    [budget, planResult],
  );

  function chooseScenario(id: string) {
    const scenario = DEMO_SCENARIOS.find((item) => item.id === id);
    if (!scenario) return;
    setGoal(scenario.prompt);
    setBudget(scenario.budget);
    setPlanResult(null);
    setApproved(false);
    setTimelineIndex(-1);
    setNotice(`${scenario.title} loaded`);
    setView("new-task");
  }

  async function generatePlan() {
    setPlanning(true);
    setNotice(null);
    setApproved(false);
    setTimelineIndex(0);
    try {
      const response = await fetch("/api/ai/plan", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          goal,
          maximumBudget: budget,
          preferredToken: "USDC",
          planner,
        }),
      });
      const payload = (await response.json()) as {
        ok: boolean;
        data: PlanResponse;
        error: { message: string } | null;
      };
      if (!payload.ok) {
        throw new Error(payload.error?.message ?? "Plan generation failed.");
      }
      setPlanResult(payload.data);
      setTimelineIndex(2);
      setAuditEvents((current) => [
        `Plan generated with ${payload.data.plannerLabel}`,
        ...current,
      ]);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Plan generation failed");
    } finally {
      setPlanning(false);
    }
  }

  async function persistDemoRecord(
    id: string,
    kind: string,
    value: Record<string, unknown>,
  ) {
    try {
      const { ProcurePilotDexie } = await import("@/src/storage/dexie");
      const db = new ProcurePilotDexie();
      await db.records.put({
        id,
        kind,
        value,
        updatedAt: new Date().toISOString(),
      });
    } catch {
      // IndexedDB can be unavailable in privacy modes. The visible workflow
      // continues in memory and never claims durable persistence.
    }
  }

  async function approvePlan() {
    if (!planResult || overBudget) {
      setNotice("Approval blocked: the estimated total exceeds the budget.");
      setAuditEvents((current) => [
        "Payment decision REJECTED — task budget exceeded",
        ...current,
      ]);
      return;
    }
    setApproved(true);
    setTimelineIndex(3);
    setNotice("Plan approved. Demo payments are ready to run.");
    setAuditEvents((current) => [
      "Plan approved and bound to canonical payment details",
      ...current,
    ]);
    await persistDemoRecord(planResult.plan.planId, "plan", {
      ...planResult.plan,
      approval: "SIMULATED_LOCAL_APPROVAL",
    });
  }

  async function runDemo() {
    if (!planResult || !approved) return;
    setRunning(true);
    setView("runs");
    const newPayments: PaymentRow[] = [];
    for (let step = 4; step < TIMELINE.length; step += 1) {
      await new Promise((resolve) => setTimeout(resolve, 260));
      setTimelineIndex(step);
      if (step === 6) {
        planResult.plan.subtasks.forEach((subtask, index) => {
          const provider = BUILT_IN_PROVIDERS.find(
            (item) => item.providerId === subtask.selectedProviderId,
          );
          newPayments.push({
            id: `sim_pay_${planResult.plan.planId.slice(-4)}_${index + 1}`,
            provider: provider?.name ?? subtask.selectedProviderId,
            amount: subtask.quotedPrice,
            status: "SETTLED",
            proof: `SIMULATED_SETTLEMENT:${index + 1}`,
          });
        });
        setPayments(newPayments);
      }
    }
    setCompletedRuns((value) => value + 1);
    setAuditEvents((current) => [
      "Task COMPLETED — final deliverable assembled",
      "Provider outputs validated before aggregation",
      ...newPayments.map(
        (payment) => `${payment.id} settled in SIMULATED PAYMENT mode`,
      ),
      ...current,
    ]);
    await persistDemoRecord(`run_${planResult.plan.planId}`, "task-run", {
      state: "COMPLETED",
      payments: newPayments,
      simulated: true,
    });
    setRunning(false);
    setNotice("Procurement run completed with simulated payments.");
  }

  async function exportData() {
    let records: unknown[] = [];
    try {
      const { ProcurePilotDexie } = await import("@/src/storage/dexie");
      records = await new ProcurePilotDexie().exportAll();
    } catch {
      records = [];
    }
    const blob = new Blob(
      [
        JSON.stringify(
          {
            product: "ProcurePilot",
            exportedAt: new Date().toISOString(),
            mode: "demo",
            records,
            auditEvents,
            payments,
          },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    const anchor = document.createElement("a");
    anchor.href = URL.createObjectURL(blob);
    anchor.download = "procurepilot-demo-export.json";
    anchor.click();
    URL.revokeObjectURL(anchor.href);
  }

  async function resetDemo() {
    try {
      const { ProcurePilotDexie } = await import("@/src/storage/dexie");
      await new ProcurePilotDexie().reset();
    } catch {
      // See persistence note in persistDemoRecord.
    }
    setPlanResult(null);
    setApproved(false);
    setTimelineIndex(-1);
    setPayments([]);
    setAuditEvents(["Demo workspace reset"]);
    setNotice("Local demo data cleared.");
  }

  function navigate(next: View) {
    setView(next);
    setMobileNav(false);
  }

  return (
    <div className={styles.shell} data-hydrated="false" ref={shellRef}>
      <aside className={`${styles.sidebar} ${mobileNav ? styles.open : ""}`}>
        <div className={styles.brand}>
          <div className={styles.brandMark}>
            <ArrowRight size={17} strokeWidth={2.6} />
          </div>
          <div>
            <strong>ProcurePilot</strong>
            <span>Agent procurement OS</span>
          </div>
          <button
            className={styles.mobileClose}
            onClick={() => setMobileNav(false)}
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        </div>
        <div className={styles.workspace}>
          <span>Workspace</span>
          <strong>Hackathon demo</strong>
          <ChevronRight size={15} />
        </div>
        <nav aria-label="Primary navigation">
          {NAV.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.id)}
                className={view === item.id ? styles.activeNav : ""}
                aria-current={view === item.id ? "page" : undefined}
              >
                <Icon size={17} />
                <span>{item.label}</span>
                {item.id === "runs" && <em>1</em>}
              </button>
            );
          })}
        </nav>
        <div className={styles.sidebarFoot}>
          <div className={styles.modeCard}>
            <span className={styles.liveDot} />
            <div>
              <strong>Scripted demo</strong>
              <span>No wallet · no API key</span>
            </div>
          </div>
          <p>GOAT testnet3 · Chain 48816</p>
        </div>
      </aside>

      <main className={styles.main}>
        <header className={styles.topbar}>
          <button
            className={styles.menuButton}
            onClick={() => setMobileNav(true)}
            aria-label="Open navigation"
          >
            <Menu size={20} />
          </button>
          <div className={styles.breadcrumb}>
            <span>ProcurePilot</span>
            <ChevronRight size={14} />
            <strong>{NAV.find((item) => item.id === view)?.label}</strong>
          </div>
          <div className={styles.topActions}>
            <StatusPill tone="amber">SIMULATED PAYMENTS</StatusPill>
            <button className={styles.iconButton} aria-label="Search">
              <Search size={18} />
            </button>
            <button className={styles.avatar} aria-label="Demo profile">
              DP
            </button>
          </div>
        </header>

        {notice && (
          <div className={styles.notice} role="status">
            <Sparkles size={16} />
            <span>{notice}</span>
            <button onClick={() => setNotice(null)} aria-label="Dismiss notice">
              <X size={15} />
            </button>
          </div>
        )}

        <div className={styles.content}>
          {view === "overview" && (
            <Overview
              completedRuns={completedRuns}
              onNewTask={() => navigate("new-task")}
              onScenario={chooseScenario}
              latestPlan={planResult?.plan ?? null}
              timelineIndex={timelineIndex}
            />
          )}
          {view === "new-task" && (
            <NewTask
              goal={goal}
              setGoal={setGoal}
              budget={budget}
              setBudget={setBudget}
              planner={planner}
              setPlanner={setPlanner}
              planning={planning}
              planResult={planResult}
              overBudget={overBudget}
              approved={approved}
              onGenerate={generatePlan}
              onApprove={approvePlan}
              onRun={runDemo}
              onScenario={chooseScenario}
            />
          )}
          {view === "runs" && (
            <TaskRun
              goal={goal}
              plan={planResult?.plan ?? null}
              index={timelineIndex}
              running={running}
              onOpenPayments={() => navigate("payments")}
            />
          )}
          {(view === "market" || view === "providers") && (
            <ProviderMarket
              profileMode={view === "providers"}
              onSelect={setSelectedProvider}
              onNewTask={() => navigate("new-task")}
            />
          )}
          {view === "payments" && <Payments payments={payments} />}
          {view === "reputation" && <Reputation />}
          {view === "audit" && (
            <Audit
              events={auditEvents}
              onExport={exportData}
              onReset={resetDemo}
            />
          )}
          {view === "integrations" && (
            <Integrations statuses={integrations} />
          )}
          {view === "docs" && <Documentation />}
        </div>
      </main>

      {selectedProvider && (
        <ProviderDrawer
          provider={selectedProvider}
          onClose={() => setSelectedProvider(null)}
          onQuote={() => {
            setSelectedProvider(null);
            navigate("new-task");
          }}
        />
      )}
    </div>
  );
}

function Overview({
  completedRuns,
  onNewTask,
  onScenario,
  latestPlan,
  timelineIndex,
}: {
  completedRuns: number;
  onNewTask: () => void;
  onScenario: (id: string) => void;
  latestPlan: ProcurementPlan | null;
  timelineIndex: number;
}) {
  return (
    <>
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <span className={styles.eyebrow}>PROCUREMENT COMMAND CENTER</span>
          <h1>
            Describe the outcome.
            <br />
            <em>We coordinate the work.</em>
          </h1>
          <p>
            One agent discovers providers, compares the trade-offs, protects
            every payment and delivers one finished result.
          </p>
          <div className={styles.heroActions}>
            <button className={styles.primaryButton} onClick={onNewTask}>
              Create a procurement task <ArrowRight size={17} />
            </button>
            <button
              className={styles.secondaryButton}
              onClick={() => onScenario("competitor-analysis")}
            >
              <Play size={16} /> Run guided demo
            </button>
          </div>
          <div className={styles.assuranceRow}>
            <span>
              <ShieldCheck size={15} /> Budget enforced
            </span>
            <span>
              <LockKeyhole size={15} /> Approval required
            </span>
            <span>
              <Network size={15} /> GOAT testnet ready
            </span>
          </div>
        </div>
        <div className={styles.commandPreview}>
          <div className={styles.previewHeader}>
            <div>
              <span className={styles.liveDot} />
              ACTIVE WORKFLOW
            </div>
            <StatusPill tone="amber">
              {timelineIndex >= 11 ? "COMPLETED" : "DEMO READY"}
            </StatusPill>
          </div>
          <blockquote>
            “Analyse three competitors for a crypto wallet product. Spend no
            more than 5 USDC.”
          </blockquote>
          <div className={styles.miniFlow}>
            {[
              ["01", "Website audit", "0.85 USDC"],
              ["02", "Research brief", "1.20 USDC"],
              ["03", "Final assembly", "Included"],
            ].map((step, index) => (
              <div key={step[0]}>
                <span>{step[0]}</span>
                <strong>{step[1]}</strong>
                <em>{step[2]}</em>
                {index < 2 && <ChevronRight size={16} />}
              </div>
            ))}
          </div>
          <div className={styles.previewTotal}>
            <div>
              <span>Estimated total</span>
              <strong>{latestPlan?.estimatedTotal ?? "2.30"} USDC</strong>
            </div>
            <div>
              <span>Budget remaining</span>
              <strong>{latestPlan?.budgetRemaining ?? "2.70"} USDC</strong>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.metricGrid} aria-label="Workspace metrics">
        {[
          ["Total tasks", "7", "+2 this week", ClipboardList],
          ["Completed", String(completedRuns), "100% validated", CheckCircle2],
          ["Provider spend", "6.45", "demo USDC", CircleDollarSign],
          ["Saved vs budget", "5.80", "across all tasks", Gauge],
          ["Active providers", "5", "3 built-in", Blocks],
          ["Average rating", "4.5", "local profiles", Star],
        ].map(([label, value, detail, Icon]) => {
          const MetricIcon = Icon as LucideIcon;
          return (
            <article className={styles.metric} key={String(label)}>
              <MetricIcon size={18} />
              <span>{label as string}</span>
              <strong>{value as string}</strong>
              <small>{detail as string}</small>
            </article>
          );
        })}
      </section>

      <section className={styles.splitSection}>
        <div className={styles.panel}>
          <div className={styles.panelHeading}>
            <div>
              <span className={styles.eyebrow}>START WITH A PROVEN FLOW</span>
              <h2>Demo scenarios</h2>
            </div>
            <button className={styles.textButton} onClick={onNewTask}>
              View all <ArrowRight size={14} />
            </button>
          </div>
          <div className={styles.scenarioList}>
            {DEMO_SCENARIOS.slice(0, 4).map((scenario, index) => (
              <button
                key={scenario.id}
                onClick={() => onScenario(scenario.id)}
              >
                <span className={styles.scenarioIcon}>
                  {index === 0 ? (
                    <Globe2 size={17} />
                  ) : index === 1 ? (
                    <Gauge size={17} />
                  ) : index === 2 ? (
                    <ShieldCheck size={17} />
                  ) : (
                    <OctagonAlert size={17} />
                  )}
                </span>
                <span>
                  <strong>{scenario.title}</strong>
                  <small>{scenario.expected}</small>
                </span>
                <em>{scenario.budget} USDC</em>
                <ChevronRight size={16} />
              </button>
            ))}
          </div>
        </div>
        <div className={`${styles.panel} ${styles.systemPanel}`}>
          <div className={styles.panelHeading}>
            <div>
              <span className={styles.eyebrow}>SYSTEM READINESS</span>
              <h2>Honest by default</h2>
            </div>
            <StatusPill tone="green">CORE WORKING</StatusPill>
          </div>
          <div className={styles.readinessList}>
            {[
              ["Scripted planner", "Working", "green"],
              ["Payment policy", "Working", "green"],
              ["AgentKit 0.2.3", "Installed", "green"],
              ["x402 settlement", "Demo only", "amber"],
              ["ERC-8004 identity", "Not configured", "neutral"],
            ].map(([label, status, tone]) => (
              <div key={label}>
                <span>{label}</span>
                <StatusPill tone={tone as "green" | "amber" | "neutral"}>
                  {status}
                </StatusPill>
              </div>
            ))}
          </div>
          <div className={styles.storageNote}>
            <Database size={17} />
            <p>
              <strong>Local demo storage</strong>
              Records remain in this browser and are not an immutable blockchain
              audit trail.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}

function NewTask({
  goal,
  setGoal,
  budget,
  setBudget,
  planner,
  setPlanner,
  planning,
  planResult,
  overBudget,
  approved,
  onGenerate,
  onApprove,
  onRun,
  onScenario,
}: {
  goal: string;
  setGoal: (value: string) => void;
  budget: string;
  setBudget: (value: string) => void;
  planner: "scripted" | "gemini";
  setPlanner: (value: "scripted" | "gemini") => void;
  planning: boolean;
  planResult: PlanResponse | null;
  overBudget: boolean;
  approved: boolean;
  onGenerate: () => void;
  onApprove: () => void;
  onRun: () => void;
  onScenario: (id: string) => void;
}) {
  return (
    <>
      <SectionTitle
        eyebrow="NEW PROCUREMENT"
        title="What should ProcurePilot deliver?"
        description="Describe the finished outcome. The planner will decompose it, compare providers and keep the total inside your limit."
      />
      <div className={styles.taskLayout}>
        <section className={styles.taskForm}>
          <div className={styles.modeSwitch}>
            <button
              className={planner === "scripted" ? styles.selectedMode : ""}
              onClick={() => setPlanner("scripted")}
            >
              <Code2 size={16} /> Scripted demo
              <StatusPill tone="green">READY</StatusPill>
            </button>
            <button
              className={planner === "gemini" ? styles.selectedMode : ""}
              onClick={() => setPlanner("gemini")}
            >
              <Sparkles size={16} /> Gemini AI
              <StatusPill>OPTIONAL</StatusPill>
            </button>
          </div>
          <label className={styles.field}>
            <span>
              Desired outcome <small>Be specific about the final result</small>
            </span>
            <textarea
              value={goal}
              onChange={(event) => setGoal(event.target.value)}
              rows={7}
              maxLength={4000}
            />
            <em>{goal.length} / 4,000</em>
          </label>
          <div className={styles.formGrid}>
            <label className={styles.field}>
              <span>Maximum budget</span>
              <div className={styles.inputWithSuffix}>
                <input
                  value={budget}
                  onChange={(event) => setBudget(event.target.value)}
                  inputMode="decimal"
                  aria-label="Maximum budget"
                />
                <strong>USDC</strong>
              </div>
            </label>
            <label className={styles.field}>
              <span>Approval mode</span>
              <select defaultValue="PLAN_TOTAL">
                <option value="PLAN_TOTAL">Approve complete plan</option>
                <option value="EVERY_PAYMENT">Confirm each payment</option>
              </select>
            </label>
            <label className={styles.field}>
              <span>Deadline</span>
              <input type="datetime-local" />
            </label>
            <label className={styles.field}>
              <span>Output format</span>
              <select defaultValue="report">
                <option value="report">Structured report</option>
                <option value="checklist">Prioritised checklist</option>
                <option value="json">JSON bundle</option>
              </select>
            </label>
          </div>
          <button
            className={styles.primaryButton}
            onClick={onGenerate}
            disabled={planning || goal.length < 10}
          >
            {planning ? (
              <>
                <RefreshCw className={styles.spin} size={17} /> Building plan…
              </>
            ) : (
              <>
                Generate procurement plan <ArrowRight size={17} />
              </>
            )}
          </button>
          <p className={styles.formFoot}>
            <ShieldCheck size={14} />
            Planning never executes a payment. Deterministic checks remain
            authoritative.
          </p>
        </section>
        <aside className={styles.examples}>
          <span className={styles.eyebrow}>ONE-CLICK SCENARIOS</span>
          <h3>Start with a demo</h3>
          {DEMO_SCENARIOS.map((scenario) => (
            <button
              key={scenario.id}
              onClick={() => onScenario(scenario.id)}
            >
              <span>
                <strong>{scenario.title}</strong>
                <small>{scenario.category.replace("_", " ")}</small>
              </span>
              <ChevronRight size={16} />
            </button>
          ))}
        </aside>
      </div>
      {planResult && (
        <PlanReview
          result={planResult}
          budget={budget}
          overBudget={overBudget}
          approved={approved}
          onApprove={onApprove}
          onRun={onRun}
        />
      )}
    </>
  );
}

function PlanReview({
  result,
  budget,
  overBudget,
  approved,
  onApprove,
  onRun,
}: {
  result: PlanResponse;
  budget: string;
  overBudget: boolean;
  approved: boolean;
  onApprove: () => void;
  onRun: () => void;
}) {
  const { plan } = result;
  return (
    <section className={styles.planReview} aria-label="Procurement plan">
      <div className={styles.planTop}>
        <div>
          <span className={styles.eyebrow}>PROPOSED PROCUREMENT PLAN</span>
          <h2>{plan.summary}</h2>
          <p>
            {result.plannerLabel} · created just now · expires in 30 minutes
          </p>
        </div>
        <StatusPill tone={overBudget ? "red" : approved ? "green" : "amber"}>
          {overBudget
            ? "BUDGET BLOCKED"
            : approved
              ? "APPROVED"
              : "AWAITING APPROVAL"}
        </StatusPill>
      </div>
      <div className={styles.subtaskList}>
        {plan.subtasks.map((subtask, index) => {
          const provider = result.providers.find(
            (item) => item.providerId === subtask.selectedProviderId,
          );
          return (
            <article key={subtask.subtaskId}>
              <div className={styles.stepNumber}>{index + 1}</div>
              <div className={styles.subtaskBody}>
                <span>{subtask.capabilityRequired.replaceAll("-", " ")}</span>
                <h3>{subtask.title}</h3>
                <p>{subtask.description}</p>
                <div className={styles.providerChoice}>
                  <div className={styles.providerAvatar}>
                    {provider?.name.charAt(0)}
                  </div>
                  <div>
                    <strong>{provider?.name}</strong>
                    <span>
                      <Star size={13} fill="currentColor" />{" "}
                      {provider?.averageRating.toFixed(1)} ·{" "}
                      {provider?.completedJobs} jobs
                    </span>
                  </div>
                  <div className={styles.scoreBadge}>91.2 score</div>
                </div>
                <details>
                  <summary>Why this provider ranked first</summary>
                  <div className={styles.scoreGrid}>
                    {[
                      ["Capability", "100"],
                      ["Price", "62"],
                      ["Reputation", String((provider?.averageRating ?? 0) * 20)],
                      ["Reliability", "96"],
                      ["Speed", "84"],
                    ].map(([label, score]) => (
                      <span key={label}>
                        {label} <strong>{Number(score).toFixed(0)}</strong>
                      </span>
                    ))}
                  </div>
                </details>
              </div>
              <div className={styles.subtaskPrice}>
                <strong>{money(subtask.quotedPrice)}</strong>
                <span>USDC</span>
              </div>
            </article>
          );
        })}
      </div>
      <div className={styles.planBottom}>
        <div className={styles.planWarnings}>
          <span>
            <ShieldCheck size={17} /> Deterministic budget and payment checks
            enabled
          </span>
          {plan.risks.map((risk) => (
            <span key={risk}>
              <OctagonAlert size={17} /> {risk}
            </span>
          ))}
        </div>
        <div className={styles.costBox}>
          <div>
            <span>Provider services</span>
            <strong>{money(plan.estimatedProviderCost)} USDC</strong>
          </div>
          <div>
            <span>ProcurePilot fee</span>
            <strong>{money(plan.orchestrationFee)} USDC</strong>
          </div>
          <div className={styles.totalRow}>
            <span>Estimated total</span>
            <strong>{money(plan.estimatedTotal)} USDC</strong>
          </div>
          <p>
            {overBudget ? (
              <span className={styles.dangerText}>
                Exceeds {money(budget)} USDC budget
              </span>
            ) : (
              <span className={styles.goodText}>
                {money(plan.budgetRemaining)} USDC remains
              </span>
            )}
          </p>
          {!approved ? (
            <button
              className={styles.primaryButton}
              onClick={onApprove}
              disabled={overBudget}
            >
              <LockKeyhole size={16} /> Approve plan
            </button>
          ) : (
            <button className={styles.runButton} onClick={onRun}>
              <Play size={16} fill="currentColor" /> Run simulated procurement
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

function TaskRun({
  goal,
  plan,
  index,
  running,
  onOpenPayments,
}: {
  goal: string;
  plan: ProcurementPlan | null;
  index: number;
  running: boolean;
  onOpenPayments: () => void;
}) {
  return (
    <>
      <SectionTitle
        eyebrow="TASK RUN"
        title={plan ? "Competitor analysis workflow" : "No active run yet"}
        description={
          plan
            ? goal
            : "Generate and approve a procurement plan to start the lifecycle."
        }
        action={
          plan ? (
            <StatusPill tone={index >= 11 ? "green" : "amber"}>
              {index >= 11 ? "COMPLETED" : running ? "RUNNING" : "READY"}
            </StatusPill>
          ) : undefined
        }
      />
      <div className={styles.runLayout}>
        <section className={styles.timelinePanel}>
          <div className={styles.panelHeading}>
            <div>
              <span className={styles.eyebrow}>LIFECYCLE</span>
              <h2>Execution timeline</h2>
            </div>
            <span className={styles.trace}>trace_demo_comp_001</span>
          </div>
          <div className={styles.timeline}>
            {TIMELINE.map(([title, detail], step) => {
              const complete = step <= index;
              const active = running && step === index;
              return (
                <div
                  key={title}
                  className={`${complete ? styles.completeStep : ""} ${active ? styles.activeStep : ""}`}
                >
                  <span className={styles.timelineNode}>
                    {complete ? <Check size={14} /> : step + 1}
                  </span>
                  <div>
                    <strong>{title}</strong>
                    <p>{detail}</p>
                  </div>
                  <time>
                    {complete
                      ? step < 4
                        ? "14:32"
                        : `14:${32 + step}`
                      : "—"}
                  </time>
                </div>
              );
            })}
          </div>
        </section>
        <aside className={styles.runSidebar}>
          <div className={styles.panel}>
            <span className={styles.eyebrow}>RUN SUMMARY</span>
            <div className={styles.runStats}>
              <div>
                <span>State</span>
                <strong>{index >= 11 ? "COMPLETED" : "IN PROGRESS"}</strong>
              </div>
              <div>
                <span>Providers</span>
                <strong>{plan?.subtasks.length ?? 0}</strong>
              </div>
              <div>
                <span>Total</span>
                <strong>{plan?.estimatedTotal ?? "0.00"} USDC</strong>
              </div>
              <div>
                <span>Mode</span>
                <strong>SIMULATED</strong>
              </div>
            </div>
          </div>
          {index >= 6 && (
            <div className={`${styles.panel} ${styles.proofPanel}`}>
              <CheckCircle2 size={24} />
              <h3>Settlement verified</h3>
              <p>
                Labelled mock proofs were recorded. No blockchain transaction
                occurred.
              </p>
              <button className={styles.secondaryButton} onClick={onOpenPayments}>
                Inspect payments <ArrowRight size={15} />
              </button>
            </div>
          )}
          {index >= 11 && (
            <div className={styles.resultCard}>
              <span className={styles.eyebrow}>FINAL DELIVERABLE</span>
              <h3>Crypto wallet competitor brief</h3>
              <p>
                Position around visible control: budget certainty, provider
                transparency and proof of delivery.
              </p>
              <ul>
                <li>3 positioning patterns compared</li>
                <li>5 prioritised recommendations</li>
                <li>Seeded evidence clearly labelled</li>
              </ul>
              <button className={styles.primaryButton}>
                <Download size={16} /> Export report
              </button>
            </div>
          )}
        </aside>
      </div>
    </>
  );
}

function ProviderMarket({
  profileMode,
  onSelect,
  onNewTask,
}: {
  profileMode: boolean;
  onSelect: (provider: Provider) => void;
  onNewTask: () => void;
}) {
  return (
    <>
      <SectionTitle
        eyebrow={profileMode ? "REGISTRY" : "PROVIDER MARKET"}
        title={profileMode ? "Provider identities" : "Compare specialist agents"}
        description={
          profileMode
            ? "Local profiles are kept visibly separate from unverified on-chain identities."
            : "Every recommendation is scored against capability, price, reputation, reliability and speed."
        }
        action={
          <button className={styles.primaryButton} onClick={onNewTask}>
            <Plus size={16} /> Request a quote
          </button>
        }
      />
      <div className={styles.marketFilters}>
        <div className={styles.searchField}>
          <Search size={16} />
          <input placeholder="Search capabilities or providers" />
        </div>
        <select defaultValue="all" aria-label="Provider source">
          <option value="all">All sources</option>
          <option value="built-in">Built-in</option>
          <option value="local">Local</option>
          <option value="erc8004">ERC-8004</option>
        </select>
        <select defaultValue="rating" aria-label="Sort providers">
          <option value="rating">Highest rated</option>
          <option value="price">Lowest price</option>
          <option value="speed">Fastest</option>
        </select>
      </div>
      <div className={styles.providerGrid}>
        {BUILT_IN_PROVIDERS.map((provider, index) => (
          <article className={styles.providerCard} key={provider.providerId}>
            <div className={styles.providerCardTop}>
              <div className={styles.largeProviderAvatar}>
                {provider.name.charAt(0)}
              </div>
              <div>
                <StatusPill tone={provider.source === "BUILT_IN" ? "gold" : "neutral"}>
                  {provider.source.replace("_", " ")}
                </StatusPill>
                <StatusPill>
                  {provider.verificationStatus.replaceAll("_", " ")}
                </StatusPill>
              </div>
            </div>
            <h2>{provider.name}</h2>
            <p>{provider.description}</p>
            <div className={styles.capabilityTags}>
              {provider.capabilities.slice(0, 3).map((capability) => (
                <span key={capability}>{capability.replaceAll("-", " ")}</span>
              ))}
            </div>
            <div className={styles.providerNumbers}>
              <div>
                <span>From</span>
                <strong>{provider.basePrice} USDC</strong>
              </div>
              <div>
                <span>Rating</span>
                <strong>
                  <Star size={13} fill="currentColor" />{" "}
                  {provider.averageRating.toFixed(1)}
                </strong>
              </div>
              <div>
                <span>Jobs</span>
                <strong>{provider.completedJobs}</strong>
              </div>
              <div>
                <span>Avg. time</span>
                <strong>{provider.averageCompletionTime}s</strong>
              </div>
            </div>
            <div className={styles.paymentStrip}>
              <span>
                <CircleDollarSign size={15} /> USDC
              </span>
              <span>
                {provider.x402Enabled ? (
                  <CheckCircle2 size={15} />
                ) : (
                  <OctagonAlert size={15} />
                )}
                x402 {provider.x402Enabled ? "live" : "demo only"}
              </span>
            </div>
            <div className={styles.cardActions}>
              <button
                className={styles.secondaryButton}
                onClick={() => onSelect(provider)}
              >
                View profile
              </button>
              <button className={styles.primaryButton} onClick={onNewTask}>
                Request quote
              </button>
            </div>
            {index === 0 && <span className={styles.featured}>TOP MATCH</span>}
          </article>
        ))}
      </div>
    </>
  );
}

function Payments({ payments }: { payments: PaymentRow[] }) {
  const rows =
    payments.length > 0
      ? payments
      : [
          {
            id: "sim_pay_demo_001",
            provider: "Website Audit Agent",
            amount: "0.85",
            status: "SETTLED" as const,
            proof: "SIMULATED_SETTLEMENT:demo_001",
          },
          {
            id: "sim_pay_demo_002",
            provider: "Research Brief Agent",
            amount: "1.20",
            status: "SETTLED" as const,
            proof: "SIMULATED_SETTLEMENT:demo_002",
          },
        ];
  return (
    <>
      <SectionTitle
        eyebrow="PAYMENT OPERATIONS"
        title="Every transfer has a guardrail"
        description="Approved details are hashed, checked again before authorization and checked once more before transfer."
      />
      <div className={styles.safetyBanner}>
        <ShieldCheck size={23} />
        <div>
          <strong>Simulation boundary active</strong>
          <span>
            These records are mock settlements. No wallet, signature or on-chain
            transaction was used.
          </span>
        </div>
        <StatusPill tone="amber">SIMULATED PAYMENT</StatusPill>
      </div>
      <div className={styles.tablePanel}>
        <div className={styles.tableHead}>
          <span>Order / payment ID</span>
          <span>Provider</span>
          <span>Amount</span>
          <span>Status</span>
          <span>Settlement proof</span>
        </div>
        {rows.map((payment) => (
          <div className={styles.tableRow} key={payment.id}>
            <span>
              <code>{payment.id}</code>
              <small>competitor-analysis</small>
            </span>
            <strong>{payment.provider}</strong>
            <span>{payment.amount} USDC</span>
            <StatusPill tone="green">{payment.status}</StatusPill>
            <code>{payment.proof}</code>
          </div>
        ))}
      </div>
      <div className={styles.paymentControls}>
        {[
          ["Quote integrity", "Recipient, token and amount are bound", BadgeCheck],
          ["Duplicate defence", "Order and idempotency keys are unique", FileCheck2],
          ["Budget boundary", "Task and daily limits are enforced", Gauge],
          ["Transfer recheck", "Approval hash must still match", LockKeyhole],
        ].map(([title, detail, Icon]) => {
          const ControlIcon = Icon as LucideIcon;
          return (
            <article key={title as string}>
              <ControlIcon size={20} />
              <strong>{title as string}</strong>
              <span>{detail as string}</span>
            </article>
          );
        })}
      </div>
    </>
  );
}

function Reputation() {
  return (
    <>
      <SectionTitle
        eyebrow="TRUST SIGNALS"
        title="Reputation with provenance"
        description="Local ratings are useful for the demo, but they are never presented as verified ERC-8004 reputation."
      />
      <div className={styles.reputationLayout}>
        <section className={styles.leaderboard}>
          <div className={styles.panelHeading}>
            <h2>Provider ranking</h2>
            <StatusPill>LOCAL DATA</StatusPill>
          </div>
          {BUILT_IN_PROVIDERS.map((provider, index) => (
            <div key={provider.providerId}>
              <strong className={styles.rank}>0{index + 1}</strong>
              <div className={styles.providerAvatar}>
                {provider.name.charAt(0)}
              </div>
              <span>
                <strong>{provider.name}</strong>
                <small>{provider.completedJobs} completed jobs</small>
              </span>
              <span className={styles.rating}>
                <Star size={14} fill="currentColor" />
                {provider.averageRating.toFixed(1)}
              </span>
              <StatusPill>
                {provider.source === "ERC8004" ? "ON-CHAIN" : "LOCAL"}
              </StatusPill>
            </div>
          ))}
        </section>
        <aside className={styles.panel}>
          <span className={styles.eyebrow}>ERC-8004 READINESS</span>
          <div className={styles.identityGraphic}>
            <Network size={32} />
          </div>
          <h2>Registration not configured</h2>
          <p>
            AgentKit identity and reputation actions are installed, but no agent
            ID has been read or verified on testnet.
          </p>
          <div className={styles.rawFacts}>
            <span>
              Registry <code>eip155:48816:0x5560…5522</code>
            </span>
            <span>
              Agent ID <code>—</code>
            </span>
            <span>
              Feedback tx <code>—</code>
            </span>
          </div>
        </aside>
      </div>
    </>
  );
}

function Audit({
  events,
  onExport,
  onReset,
}: {
  events: string[];
  onExport: () => void;
  onReset: () => void;
}) {
  return (
    <>
      <SectionTitle
        eyebrow="AUDIT TRAIL"
        title="Trace every consequential decision"
        description="Append-style local events connect task state, provider choice, payment policy and validation outcomes."
        action={
          <div className={styles.inlineActions}>
            <button className={styles.secondaryButton} onClick={onExport}>
              <Download size={16} /> Export JSON
            </button>
            <button className={styles.dangerButton} onClick={onReset}>
              <RefreshCw size={16} /> Reset demo
            </button>
          </div>
        }
      />
      <div className={styles.auditNotice}>
        <Database size={18} />
        Local demo storage — records remain in this browser and are not an
        immutable blockchain audit trail.
      </div>
      <div className={styles.auditTable}>
        <div className={styles.auditHead}>
          <span>Event</span>
          <span>Actor</span>
          <span>Environment</span>
          <span>Timestamp</span>
        </div>
        {events.map((event, index) => (
          <div key={`${event}-${index}`}>
            <span>
              <code>evt_{String(events.length - index).padStart(3, "0")}</code>
              <strong>{event}</strong>
            </span>
            <span>{event.includes("approved") ? "USER" : "ORCHESTRATOR"}</span>
            <StatusPill tone="amber">DEMO</StatusPill>
            <time>
              {new Date(
                Date.parse("2026-07-23T18:00:00.000Z") - index * 34_000,
              ).toLocaleTimeString()}
            </time>
          </div>
        ))}
      </div>
    </>
  );
}

function Integrations({ statuses }: { statuses: IntegrationStatus[] }) {
  return (
    <>
      <SectionTitle
        eyebrow="INTEGRATION HEALTH"
        title="Configuration is not the same as proof"
        description="A status only says WORKING after a concrete local or network health check succeeds."
      />
      <div className={styles.integrationGrid}>
        {statuses.map((status) => {
          const tone =
            status.state === "WORKING"
              ? "green"
              : status.state === "ERROR"
                ? "red"
                : status.state === "DEMO_ONLY"
                  ? "amber"
                  : "neutral";
          const Icon =
            status.id.includes("gemini") || status.id.includes("scripted")
              ? Bot
              : status.id.includes("rpc")
                ? Globe2
                : status.id.includes("wallet") ||
                    status.id.includes("x402")
                  ? WalletCards
                  : status.id.includes("storage")
                    ? Database
                    : status.id.includes("erc")
                      ? Network
                      : ServerCog;
          return (
            <article key={status.id}>
              <div className={styles.integrationIcon}>
                <Icon size={21} />
              </div>
              <StatusPill tone={tone}>{status.state}</StatusPill>
              <h2>{status.label}</h2>
              <p>{status.detail}</p>
              <button className={styles.textButton}>
                Inspect details <ChevronRight size={14} />
              </button>
            </article>
          );
        })}
      </div>
      <div className={styles.configGuide}>
        <KeyRound size={22} />
        <div>
          <h2>Add optional credentials safely</h2>
          <p>
            Put secrets directly in the ignored <code>.env.local</code> file.
            Never paste a private key, seed phrase or merchant secret into chat.
          </p>
        </div>
      </div>
    </>
  );
}

function Documentation() {
  return (
    <>
      <SectionTitle
        eyebrow="DOCUMENTATION"
        title="Build, operate and verify ProcurePilot"
        description="The implementation is designed to be understood from domain rules outward, with claims tied to evidence."
      />
      <div className={styles.docsGrid}>
        {[
          ["Architecture", "Domain engine, adapters and trust boundaries", Box],
          ["Procurement flow", "From goal parsing to final aggregation", ArrowRight],
          ["Provider system", "Schemas, ranking and output validation", Store],
          ["x402 integration", "Payer actions, merchant routes and safety", Zap],
          ["ERC-8004", "Identity, metadata and reputation boundaries", Network],
          ["AI design", "Gemini decomposition with deterministic control", Bot],
          ["Security", "Threat model, abuse cases and limitations", ShieldCheck],
          ["Free build guide", "Run the full demo without paid services", CircleDollarSign],
          ["Testnet setup", "GOAT testnet3 configuration and manual gates", Globe2],
          ["Demo script", "Eight repeatable product and control scenarios", Play],
          ["Deployment", "Free personal-project hosting checklist", ServerCog],
          ["Claims checklist", "Evidence for every integration claim", FileCheck2],
        ].map(([title, detail, Icon]) => {
          const DocIcon = Icon as LucideIcon;
          return (
            <article key={title as string}>
              <DocIcon size={21} />
              <h2>{title as string}</h2>
              <p>{detail as string}</p>
              <span>
                Read document <ArrowRight size={14} />
              </span>
            </article>
          );
        })}
      </div>
      <div className={styles.techFacts}>
        <span>Next.js 16</span>
        <span>TypeScript strict</span>
        <span>AgentKit 0.2.3</span>
        <span>GOAT testnet3</span>
        <span>Vitest + Playwright</span>
        <span>Dexie IndexedDB</span>
      </div>
    </>
  );
}

function ProviderDrawer({
  provider,
  onClose,
  onQuote,
}: {
  provider: Provider;
  onClose: () => void;
  onQuote: () => void;
}) {
  return (
    <div className={styles.drawerBackdrop} onMouseDown={onClose}>
      <aside
        className={styles.drawer}
        onMouseDown={(event) => event.stopPropagation()}
        aria-label={`${provider.name} profile`}
      >
        <button className={styles.drawerClose} onClick={onClose} aria-label="Close">
          <X size={18} />
        </button>
        <div className={styles.drawerHero}>
          <div className={styles.largeProviderAvatar}>
            {provider.name.charAt(0)}
          </div>
          <StatusPill tone="gold">{provider.source.replace("_", " ")}</StatusPill>
          <h2>{provider.name}</h2>
          <p>{provider.description}</p>
        </div>
        <div className={styles.drawerFacts}>
          <div>
            <span>Base price</span>
            <strong>{provider.basePrice} USDC</strong>
          </div>
          <div>
            <span>Reputation</span>
            <strong>{provider.averageRating.toFixed(1)} / 5</strong>
          </div>
          <div>
            <span>Failure rate</span>
            <strong>
              {(
                (provider.failedJobs /
                  (provider.completedJobs + provider.failedJobs)) *
                100
              ).toFixed(1)}
              %
            </strong>
          </div>
          <div>
            <span>Average time</span>
            <strong>{provider.averageCompletionTime}s</strong>
          </div>
        </div>
        <h3>Capabilities</h3>
        <div className={styles.capabilityTags}>
          {provider.capabilities.map((capability) => (
            <span key={capability}>{capability.replaceAll("-", " ")}</span>
          ))}
        </div>
        <h3>Identity & payment</h3>
        <div className={styles.rawFacts}>
          <span>
            Verification <code>{provider.verificationStatus}</code>
          </span>
          <span>
            ERC-8004 ID <code>{provider.erc8004AgentId ?? "not configured"}</code>
          </span>
          <span>
            Payout <code>{shortAddress(provider.payoutAddress)}</code>
          </span>
          <span>
            x402 <code>{provider.x402Enabled ? "LIVE" : "DEMO ONLY"}</code>
          </span>
        </div>
        <details className={styles.technicalDetails}>
          <summary>Raw technical information</summary>
          <pre>{JSON.stringify(provider, null, 2)}</pre>
        </details>
        <button className={styles.primaryButton} onClick={onQuote}>
          Request a quote <ArrowRight size={16} />
        </button>
      </aside>
    </div>
  );
}
