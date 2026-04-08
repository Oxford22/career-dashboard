"use client";

import { useState, useMemo } from "react";
import { jobs, getPipelineStats, Job, EmailThread } from "./data/jobs";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import {
  Briefcase,
  Mail,
  TrendingUp,
  FileText,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ArrowDownLeft,
  ArrowUpRight,
  Filter,
  Calendar,
  Target,
  AlertCircle,
  CheckCircle2,
  Clock,
  Eye,
  Sparkles,
  XCircle,
} from "lucide-react";

type TabType = "pipeline" | "analytics" | "email" | "details";
type FilterType = "all" | "active" | "interviewing" | "new" | "rejected";

const GRADE_COLORS: Record<string, string> = {
  "A+": "text-emerald-400",
  A: "text-emerald-400",
  "A-": "text-emerald-400",
  "B+": "text-blue-400",
  B: "text-blue-400",
  "B-": "text-blue-400",
  "C+": "text-yellow-400",
  C: "text-yellow-400",
  "C-": "text-yellow-400",
};

const STATUS_COLORS: Record<string, string> = {
  new_opportunity: "bg-purple-500/20 text-purple-400 border-purple-500/50",
  applied: "bg-blue-500/20 text-blue-400 border-blue-500/50",
  app_viewed: "bg-cyan-500/20 text-cyan-400 border-cyan-500/50",
  interviewing: "bg-emerald-500/20 text-emerald-400 border-emerald-500/50",
  follow_up_needed: "bg-amber-500/20 text-amber-400 border-amber-500/50",
  rejected: "bg-red-500/20 text-red-400 border-red-500/50",
  offer: "bg-emerald-500/20 text-emerald-400 border-emerald-500/50",
  passed: "bg-zinc-600/20 text-zinc-400 border-zinc-600/50",
};

const EMAIL_TYPE_COLORS: Record<string, string> = {
  interview_invite: "bg-emerald-500/20 text-emerald-400 border-emerald-500/50",
  rejection: "bg-red-500/20 text-red-400 border-red-500/50",
  application_received: "bg-blue-500/20 text-blue-400 border-blue-500/50",
  follow_up: "bg-amber-500/20 text-amber-400 border-amber-500/50",
  viewed: "bg-cyan-500/20 text-cyan-400 border-cyan-500/50",
  next_steps: "bg-purple-500/20 text-purple-400 border-purple-500/50",
  general: "bg-zinc-600/20 text-zinc-400 border-zinc-600/50",
};

const FIT_LEVEL_COLORS: Record<string, string> = {
  primary: "bg-emerald-500/20 text-emerald-400 border-emerald-500/50",
  secondary: "bg-blue-500/20 text-blue-400 border-blue-500/50",
  adjacent: "bg-yellow-500/20 text-yellow-400 border-yellow-500/50",
};

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabType>("pipeline");
  const [filter, setFilter] = useState<FilterType>("all");
  const [expandedJob, setExpandedJob] = useState<string | null>(null);

  const stats = useMemo(() => getPipelineStats(), []);

  const filteredJobs = useMemo(() => {
    let filtered = [...jobs];
    if (filter === "active") {
      filtered = filtered.filter(
        (j) => !["rejected", "passed"].includes(j.status)
      );
    } else if (filter === "interviewing") {
      filtered = filtered.filter((j) => j.status === "interviewing");
    } else if (filter === "new") {
      filtered = filtered.filter((j) => j.status === "new_opportunity");
    } else if (filter === "rejected") {
      filtered = filtered.filter((j) => j.status === "rejected");
    }
    return filtered.sort((a, b) => b.overallScore - a.overallScore);
  }, [filter]);

  const allEmails = useMemo(() => {
    const emails: Array<EmailThread & { company: string; jobId: string }> = [];
    jobs.forEach((job) => {
      job.emailThreads.forEach((email) => {
        emails.push({ ...email, company: job.company, jobId: job.id });
      });
    });
    return emails.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, []);

  const emailsByDate = useMemo(() => {
    const grouped: Record<
      string,
      Array<EmailThread & { company: string; jobId: string }>
    > = {};
    allEmails.forEach((email) => {
      if (!grouped[email.date]) grouped[email.date] = [];
      grouped[email.date].push(email);
    });
    return grouped;
  }, [allEmails]);

  const statusDistribution = useMemo(() => {
    const dist: Record<string, number> = {};
    jobs.forEach((job) => {
      dist[job.status] = (dist[job.status] || 0) + 1;
    });
    return Object.entries(dist).map(([name, value]) => ({
      name: name.replace(/_/g, " ").toUpperCase(),
      value,
    }));
  }, []);

  const archetypeDistribution = useMemo(() => {
    const dist: Record<string, number> = {};
    jobs.forEach((job) => {
      dist[job.archetype] = (dist[job.archetype] || 0) + 1;
    });
    return Object.entries(dist).map(([name, value]) => ({ name, value }));
  }, []);

  const fitLevelDistribution = useMemo(() => {
    const dist: Record<string, number> = {};
    jobs.forEach((job) => {
      dist[job.fitLevel] = (dist[job.fitLevel] || 0) + 1;
    });
    return Object.entries(dist).map(([name, value]) => ({
      name: name.toUpperCase(),
      value,
    }));
  }, []);

  const scoresByCompany = useMemo(() => {
    return jobs
      .map((job) => ({
        company: job.company,
        score: job.overallScore,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 15);
  }, []);

  const avgDimensionScores = useMemo(() => {
    const dimensions = [
      "roleAlignment",
      "skillMatch",
      "industryFit",
      "levelFit",
      "locationMatch",
      "compFit",
      "cultureFit",
      "growthPotential",
      "brandSignal",
      "narrativeAlignment",
    ];
    return dimensions.map((dim) => {
      const avg =
        jobs.reduce(
          (sum, job) => sum + job.scores[dim as keyof typeof job.scores],
          0
        ) / jobs.length;
      return {
        dimension: dim
          .replace(/([A-Z])/g, " $1")
          .replace(/^./, (str) => str.toUpperCase()),
        score: Math.round(avg),
      };
    });
  }, []);

  const CHART_COLORS = [
    "#10b981",
    "#3b82f6",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#ec4899",
    "#06b6d4",
    "#84cc16",
    "#f97316",
    "#14b8a6",
  ];

  const renderHeader = () => (
    <div className="mb-8">
      <h1 className="text-4xl font-bold text-white mb-2">
        William Webster Cahan
      </h1>
      <p className="text-xl text-zinc-400 mb-6">
        AI Investor | PE/VC Associate | GTM Strategist
      </p>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          label="Total Applications"
          value={stats.total}
          icon={<Briefcase className="w-5 h-5" />}
          color="text-blue-400"
        />
        <StatCard
          label="Active Pipeline"
          value={stats.active}
          icon={<TrendingUp className="w-5 h-5" />}
          color="text-emerald-400"
        />
        <StatCard
          label="Interviewing"
          value={stats.interviewing}
          icon={<CheckCircle2 className="w-5 h-5" />}
          color="text-emerald-400"
        />
        <StatCard
          label="New Opportunities"
          value={stats.newOpps}
          icon={<Sparkles className="w-5 h-5" />}
          color="text-purple-400"
        />
        <StatCard
          label="Avg Score"
          value={stats.avgScore}
          icon={<Target className="w-5 h-5" />}
          color="text-yellow-400"
        />
        <StatCard
          label="Rejection Rate"
          value={`${Math.round((stats.rejected / stats.total) * 100)}%`}
          icon={<XCircle className="w-5 h-5" />}
          color="text-red-400"
        />
      </div>
    </div>
  );

  const renderTabs = () => (
    <div className="flex gap-2 mb-6 border-b border-zinc-800 pb-2">
      <TabButton
        active={activeTab === "pipeline"}
        onClick={() => setActiveTab("pipeline")}
        icon={<Briefcase className="w-4 h-4" />}
      >
        Pipeline
      </TabButton>
      <TabButton
        active={activeTab === "analytics"}
        onClick={() => setActiveTab("analytics")}
        icon={<TrendingUp className="w-4 h-4" />}
      >
        Analytics
      </TabButton>
      <TabButton
        active={activeTab === "email"}
        onClick={() => setActiveTab("email")}
        icon={<Mail className="w-4 h-4" />}
      >
        Email Activity
      </TabButton>
      <TabButton
        active={activeTab === "details"}
        onClick={() => setActiveTab("details")}
        icon={<FileText className="w-4 h-4" />}
      >
        Job Details
      </TabButton>
    </div>
  );

  const renderPipelineTab = () => (
    <div>
      <div className="flex gap-2 mb-4 flex-wrap">
        <FilterButton
          active={filter === "all"}
          onClick={() => setFilter("all")}
        >
          All ({jobs.length})
        </FilterButton>
        <FilterButton
          active={filter === "active"}
          onClick={() => setFilter("active")}
        >
          Active ({stats.active})
        </FilterButton>
        <FilterButton
          active={filter === "interviewing"}
          onClick={() => setFilter("interviewing")}
        >
          Interviewing ({stats.interviewing})
        </FilterButton>
        <FilterButton
          active={filter === "new"}
          onClick={() => setFilter("new")}
        >
          New Opportunities ({stats.newOpps})
        </FilterButton>
        <FilterButton
          active={filter === "rejected"}
          onClick={() => setFilter("rejected")}
        >
          Rejected ({stats.rejected})
        </FilterButton>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-800">
              <th className="text-left py-3 px-4 text-zinc-400 font-medium">
                Company
              </th>
              <th className="text-left py-3 px-4 text-zinc-400 font-medium">
                Title
              </th>
              <th className="text-left py-3 px-4 text-zinc-400 font-medium">
                Grade
              </th>
              <th className="text-left py-3 px-4 text-zinc-400 font-medium">
                Score
              </th>
              <th className="text-left py-3 px-4 text-zinc-400 font-medium">
                Archetype
              </th>
              <th className="text-left py-3 px-4 text-zinc-400 font-medium">
                Fit Level
              </th>
              <th className="text-left py-3 px-4 text-zinc-400 font-medium">
                Status
              </th>
              <th className="text-left py-3 px-4 text-zinc-400 font-medium">
                Applied Date
              </th>
              <th className="text-left py-3 px-4 text-zinc-400 font-medium">
                Link
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredJobs.map((job) => (
              <tr
                key={job.id}
                className="border-b border-zinc-800/50 hover:bg-zinc-900/30 transition-colors"
              >
                <td className="py-3 px-4 text-white font-medium">
                  {job.company}
                </td>
                <td className="py-3 px-4 text-zinc-300">{job.title}</td>
                <td className="py-3 px-4">
                  <span
                    className={`font-bold ${
                      GRADE_COLORS[job.overallGrade] || "text-zinc-400"
                    }`}
                  >
                    {job.overallGrade}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium min-w-[2rem]">
                      {job.overallScore}
                    </span>
                    <div className="w-16 h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-blue-500"
                        style={{ width: `${job.overallScore}%` }}
                      />
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4 text-zinc-300 text-sm">
                  {job.archetype}
                </td>
                <td className="py-3 px-4">
                  <span
                    className={`px-2 py-1 rounded text-xs border ${
                      FIT_LEVEL_COLORS[job.fitLevel]
                    }`}
                  >
                    {job.fitLevel.toUpperCase()}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span
                    className={`px-2 py-1 rounded text-xs border ${
                      STATUS_COLORS[job.status]
                    }`}
                  >
                    {job.status.replace(/_/g, " ").toUpperCase()}
                  </span>
                </td>
                <td className="py-3 px-4 text-zinc-400 text-sm">
                  {job.appliedDate || "Not applied"}
                </td>
                <td className="py-3 px-4">
                  <a
                    href={job.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderAnalyticsTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Scores by Company">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={scoresByCompany}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis
                dataKey="company"
                angle={-45}
                textAnchor="end"
                height={120}
                tick={{ fill: "#a1a1aa", fontSize: 11 }}
              />
              <YAxis tick={{ fill: "#a1a1aa" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#18181b",
                  border: "1px solid #3f3f46",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="score" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Status Distribution">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }: { name?: string; percent?: number }) =>
                  `${name ?? ""}: ${((percent ?? 0) * 100).toFixed(0)}%`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {statusDistribution.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#18181b",
                  border: "1px solid #3f3f46",
                  borderRadius: "8px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Archetype Distribution">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={archetypeDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }: { name?: string; percent?: number }) =>
                  `${name ?? ""}: ${((percent ?? 0) * 100).toFixed(0)}%`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {archetypeDistribution.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#18181b",
                  border: "1px solid #3f3f46",
                  borderRadius: "8px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Fit Level Distribution">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={fitLevelDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }: { name?: string; percent?: number }) =>
                  `${name ?? ""}: ${((percent ?? 0) * 100).toFixed(0)}%`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {fitLevelDistribution.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#18181b",
                  border: "1px solid #3f3f46",
                  borderRadius: "8px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <ChartCard title="Average Dimension Scores">
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={avgDimensionScores} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis type="number" tick={{ fill: "#a1a1aa" }} domain={[0, 100]} />
            <YAxis
              type="category"
              dataKey="dimension"
              tick={{ fill: "#a1a1aa", fontSize: 12 }}
              width={150}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#18181b",
                border: "1px solid #3f3f46",
                borderRadius: "8px",
              }}
            />
            <Bar dataKey="score" fill="#10b981" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );

  const renderEmailTab = () => (
    <div className="space-y-6">
      {Object.entries(emailsByDate).map(([date, emails]) => (
        <div key={date}>
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-zinc-500" />
            <h3 className="text-zinc-400 font-medium">{date}</h3>
          </div>
          <div className="space-y-2">
            {emails.map((email, idx) => (
              <div
                key={`${email.jobId}-${idx}`}
                className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 hover:border-zinc-700 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    {email.direction === "inbound" ? (
                      <ArrowDownLeft className="w-5 h-5 text-blue-400 mt-1 flex-shrink-0" />
                    ) : (
                      <ArrowUpRight className="w-5 h-5 text-emerald-400 mt-1 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-white font-medium">
                          {email.company}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-xs border ${
                            EMAIL_TYPE_COLORS[email.type]
                          }`}
                        >
                          {email.type.replace(/_/g, " ").toUpperCase()}
                        </span>
                      </div>
                      <div className="text-sm text-zinc-300 mb-1">
                        {email.subject}
                      </div>
                      <div className="text-sm text-zinc-500 truncate">
                        {email.snippet}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-zinc-500 flex-shrink-0">
                    {email.from === "William Cahan" ? "You" : email.from}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  const renderDetailsTab = () => (
    <div className="space-y-4">
      {filteredJobs.map((job) => {
        const isExpanded = expandedJob === job.id;
        return (
          <div
            key={job.id}
            className="bg-zinc-900/50 border border-zinc-800 rounded-lg overflow-hidden"
          >
            <div
              className="p-4 cursor-pointer hover:bg-zinc-900/70 transition-colors"
              onClick={() =>
                setExpandedJob(isExpanded ? null : job.id)
              }
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold text-white">
                      {job.company}
                    </h3>
                    <span
                      className={`px-2 py-1 rounded text-xs border font-semibold ${
                        GRADE_COLORS[job.overallGrade] || "text-zinc-400"
                      } border-zinc-700`}
                    >
                      {job.overallGrade}
                    </span>
                    <span className="text-emerald-400 font-bold">
                      {job.overallScore}
                    </span>
                    <span
                      className={`px-2 py-1 rounded text-xs border ${
                        STATUS_COLORS[job.status]
                      }`}
                    >
                      {job.status.replace(/_/g, " ").toUpperCase()}
                    </span>
                    <span
                      className={`px-2 py-1 rounded text-xs border ${
                        FIT_LEVEL_COLORS[job.fitLevel]
                      }`}
                    >
                      {job.fitLevel.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-zinc-300 mb-1">{job.title}</p>
                  <p className="text-sm text-zinc-500">
                    {job.location} • {job.salary}
                  </p>
                </div>
                <button className="text-zinc-400 hover:text-white transition-colors">
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {isExpanded && (
              <div className="border-t border-zinc-800 p-4 space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-zinc-400 mb-2">
                    Summary
                  </h4>
                  <p className="text-zinc-300 text-sm">{job.summary}</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-semibold text-emerald-400 mb-2 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      Strengths
                    </h4>
                    <ul className="space-y-1">
                      {job.strengths.map((strength, idx) => (
                        <li
                          key={idx}
                          className="text-sm text-zinc-300 flex items-start gap-2"
                        >
                          <span className="text-emerald-400 mt-0.5">•</span>
                          <span>{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-amber-400 mb-2 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      Gaps
                    </h4>
                    <ul className="space-y-1">
                      {job.gaps.map((gap, idx) => (
                        <li
                          key={idx}
                          className="text-sm text-zinc-300 flex items-start gap-2"
                        >
                          <span className="text-amber-400 mt-0.5">•</span>
                          <span>{gap}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-zinc-400 mb-3">
                    Dimension Scores
                  </h4>
                  <div className="space-y-2">
                    {Object.entries(job.scores).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-3">
                        <div className="w-40 text-sm text-zinc-400">
                          {key
                            .replace(/([A-Z])/g, " $1")
                            .replace(/^./, (str) => str.toUpperCase())}
                        </div>
                        <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-blue-500"
                            style={{ width: `${value}%` }}
                          />
                        </div>
                        <div className="w-12 text-sm text-white text-right font-medium">
                          {value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {job.emailThreads.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-zinc-400 mb-3 flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email Timeline
                    </h4>
                    <div className="space-y-2">
                      {job.emailThreads
                        .sort(
                          (a, b) =>
                            new Date(b.date).getTime() -
                            new Date(a.date).getTime()
                        )
                        .map((email, idx) => (
                          <div
                            key={idx}
                            className="bg-zinc-950/50 border border-zinc-800 rounded p-3"
                          >
                            <div className="flex items-start gap-2 mb-1">
                              {email.direction === "inbound" ? (
                                <ArrowDownLeft className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                              ) : (
                                <ArrowUpRight className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                              )}
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs text-zinc-500">
                                    {email.date}
                                  </span>
                                  <span
                                    className={`px-2 py-0.5 rounded text-xs border ${
                                      EMAIL_TYPE_COLORS[email.type]
                                    }`}
                                  >
                                    {email.type.replace(/_/g, " ").toUpperCase()}
                                  </span>
                                </div>
                                <div className="text-sm text-zinc-300 mb-1">
                                  {email.subject}
                                </div>
                                <div className="text-xs text-zinc-500">
                                  {email.snippet}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                <div className="pt-2">
                  <a
                    href={job.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Apply
                  </a>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6 lg:p-12">
      <div className="max-w-7xl mx-auto">
        {renderHeader()}
        {renderTabs()}

        <div className="mt-6">
          {activeTab === "pipeline" && renderPipelineTab()}
          {activeTab === "analytics" && renderAnalyticsTab()}
          {activeTab === "email" && renderEmailTab()}
          {activeTab === "details" && renderDetailsTab()}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-zinc-400">{label}</span>
        <span className={color}>{icon}</span>
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
        active
          ? "bg-blue-600 text-white"
          : "text-zinc-400 hover:text-white hover:bg-zinc-900/50"
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
        active
          ? "bg-emerald-600 text-white border-emerald-600"
          : "text-zinc-400 border-zinc-700 hover:text-white hover:border-zinc-600"
      }`}
    >
      {children}
    </button>
  );
}

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
      {children}
    </div>
  );
}

