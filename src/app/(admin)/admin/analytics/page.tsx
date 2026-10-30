"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type CompletedCampaign = { id:number; campaignCode:string; productName:string; brandName:string; completedAt:string|null };
type DistributionItem = { label:string; count:number; percentage:number };
type RatingItem = { rating:number; count:number; percentage:number };
type QuestionAnalytics = { id:number; questionText:string; questionType:string; source:string; responseCount:number; options:DistributionItem[] };
type AnalyticsData = {
  campaign:{ id:number; campaignCode:string; productName:string; brandName:string; status:string; completedAt:string|null };
  summary:{ completedTesters:number; ratedTesters:number; averageRating:number|null };
  rating:{ average:number|null; totalRatings:number; distribution:RatingItem[] };
  gender:DistributionItem[];
  ageGroups:DistributionItem[];
  topCities:DistributionItem[];
  fixedQuestions:QuestionAnalytics[];
  brandQuestions:QuestionAnalytics[];
};
type CampaignListResponse = { success:boolean; message?:string; data?:CompletedCampaign[] };
type AnalyticsResponse = { success:boolean; message?:string; data?:AnalyticsData };

export default function AdminAnalyticsPage() {
  const [campaigns,setCampaigns] = useState<CompletedCampaign[]>([]);
  const [selectedCampaignId,setSelectedCampaignId] = useState("");
  const [analytics,setAnalytics] = useState<AnalyticsData|null>(null);
  const [campaignLoading,setCampaignLoading] = useState(true);
  const [analyticsLoading,setAnalyticsLoading] = useState(false);
  const [error,setError] = useState("");

  const loadCompletedCampaigns = useCallback(async () => {
    try {
      setCampaignLoading(true); setError("");
      const response = await fetch("/api/admin/analytics/campaigns", { method:"GET", credentials:"include", cache:"no-store" });
      const result = (await response.json()) as CampaignListResponse;
      if (!response.ok || !result.success) throw new Error(result.message || "Unable to load completed campaigns.");
      const items = result.data ?? [];
      setCampaigns(items);
      if (items.length === 0) { setSelectedCampaignId(""); setAnalytics(null); }
    } catch (err) {
      console.error("ADMIN ANALYTICS CAMPAIGN LIST ERROR:", err);
      setCampaigns([]); setAnalytics(null);
      setError(err instanceof Error ? err.message : "Unable to load completed campaigns.");
    } finally { setCampaignLoading(false); }
  },[]);

  useEffect(() => { loadCompletedCampaigns(); },[loadCompletedCampaigns]);

  const loadAnalytics = useCallback(async (campaignId:string) => {
    if (!campaignId) { setAnalytics(null); return; }
    try {
      setAnalyticsLoading(true); setError("");
      const response = await fetch(`/api/admin/analytics/campaigns/${campaignId}`, { method:"GET", credentials:"include", cache:"no-store" });
      const result = (await response.json()) as AnalyticsResponse;
      if (!response.ok || !result.success || !result.data) throw new Error(result.message || "Unable to load campaign analytics.");
      setAnalytics(result.data);
    } catch (err) {
      console.error("ADMIN CAMPAIGN ANALYTICS ERROR:", err);
      setAnalytics(null);
      setError(err instanceof Error ? err.message : "Unable to load campaign analytics.");
    } finally { setAnalyticsLoading(false); }
  },[]);

  useEffect(() => { loadAnalytics(selectedCampaignId); },[selectedCampaignId,loadAnalytics]);

  const handleDownloadAnalytics = useCallback(() => {
    if (!analytics) return;

    const rows: (string | number)[][] = [];

    const addRow = (...values: (string | number)[]) => rows.push(values);

    addRow("Revtail Campaign Analytics");
    addRow("Campaign", analytics.campaign.productName);
    addRow("Campaign Code", analytics.campaign.campaignCode);
    addRow("Brand", analytics.campaign.brandName);
    addRow("Status", analytics.campaign.status);
    addRow("Completed", formatDate(analytics.campaign.completedAt));
    addRow("");

    addRow("SUMMARY");
    addRow("Average Rating", analytics.rating.average ?? "");
    addRow("Completed Testers", analytics.summary.completedTesters);
    addRow("Ratings Received", analytics.summary.ratedTesters);
    addRow("");

    addRow("STAR RATING");
    addRow("Rating", "Count", "Percentage");
    analytics.rating.distribution
      .slice()
      .sort((a,b)=>b.rating-a.rating)
      .forEach(item => addRow(`${item.rating} Star`, item.count, `${item.percentage.toFixed(1)}%`));
    addRow("");

    addRow("GENDER DISTRIBUTION");
    addRow("Gender", "Count", "Percentage");
    analytics.gender.forEach(item => addRow(item.label, item.count, `${item.percentage.toFixed(1)}%`));
    addRow("");

    addRow("AGE GROUP");
    addRow("Age Group", "Count", "Percentage");
    analytics.ageGroups.forEach(item => addRow(item.label, item.count, `${item.percentage.toFixed(1)}%`));
    addRow("");

    addRow("TOP CITIES");
    addRow("City", "Count", "Percentage");
    analytics.topCities.forEach(item => addRow(item.label, item.count, `${item.percentage.toFixed(1)}%`));
    addRow("");

    const addQuestionSection = (title: string, questions: QuestionAnalytics[]) => {
      addRow(title);
      questions.forEach((question, index) => {
        addRow(`${index + 1}. ${question.questionText}`);
        addRow("Type", formatQuestionType(question.questionType));
        addRow("Responses", question.responseCount);

        if (question.options.length > 0) {
          addRow("Option", "Count", "Percentage");
          question.options.forEach(option =>
            addRow(option.label, option.count, `${option.percentage.toFixed(1)}%`)
          );
        } else {
          addRow("Text response question - option percentages not applicable");
        }

        addRow("");
      });
    };

    addQuestionSection("FIXED QUESTIONS", analytics.fixedQuestions);

    const escapeCsv = (value: string | number) => {
      const text = String(value ?? "");
      return `"${text.replaceAll('"', '""')}"`;
    };

    const csv = rows.map(row => row.map(escapeCsv).join(",")).join("\r\n");
    const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `campaign-analytics-${analytics.campaign.campaignCode}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }, [analytics]);

  return <>
    <div className="col-12">
      <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-end gap-3 mb-4">
        <div>
          <div className="text-muted small fw-semibold">REVTAIL · ADMIN</div>
          <h3 className="fw-bold mb-1">Campaign Analytics</h3>
          <p className="text-muted mb-0">Select a completed campaign to view its final tester analytics.</p>
        </div>
        {analytics && (
          <div className="d-flex flex-wrap align-items-center gap-2">
            <span className="badge bg-success fs-6 px-3 py-2">Campaign Completed</span>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleDownloadAnalytics}
              title="Download this campaign analytics as CSV"
            >
              <i className="bi bi-download me-2" />
              Download Analytics
            </button>
          </div>
        )}
      </div>
    </div>

    <div className="col-12">
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <div className="row align-items-end g-3">
            <div className="col-lg-8">
              <label className="form-label fw-semibold">Completed Campaign</label>
              <select className="form-select" value={selectedCampaignId} disabled={campaignLoading}
                onChange={(e)=>{ setSelectedCampaignId(e.target.value); setAnalytics(null); }}>
                <option value="">{campaignLoading ? "Loading completed campaigns..." : "Select a completed campaign"}</option>
                {campaigns.map(c => <option key={c.id} value={c.id}>{c.productName} — {c.campaignCode} — {c.brandName}</option>)}
              </select>
            </div>
            <div className="col-lg-4"><div className="small text-muted">Only <strong>COMPLETED</strong> campaigns are available for final analytics.</div></div>
          </div>
        </div>
      </div>
    </div>

    {error && <div className="col-12"><div className="alert alert-danger"><i className="bi bi-exclamation-triangle me-2" />{error}</div></div>}

    {!campaignLoading && campaigns.length===0 && <EmptyState icon="bi-bar-chart" title="No completed campaigns" text="Analytics will be available after a campaign is marked as completed." />}
    {!campaignLoading && campaigns.length>0 && !selectedCampaignId && <EmptyState icon="bi-graph-up-arrow" title="Select a campaign" text="Choose a completed campaign above to generate its analytics report." />}

    {analyticsLoading && <div className="col-12"><div className="card border-0 shadow-sm"><div className="card-body text-center py-5"><div className="spinner-border text-primary" /><div className="text-muted mt-3">Loading campaign analytics...</div></div></div></div>}

    {!analyticsLoading && analytics && <>
      <CampaignHeader analytics={analytics} />
      <SummaryCards analytics={analytics} />

      <div className="col-12"><div className="row g-4">
        <div className="col-xl-6"><AnalyticsCard title="Star Rating" subtitle="Distribution of approved Task 3 ratings."><RatingChart data={analytics.rating.distribution} /></AnalyticsCard></div>
        <div className="col-xl-6"><AnalyticsCard title="Gender Distribution" subtitle="Completed testers by gender."><GenderChart data={analytics.gender} /></AnalyticsCard></div>
        <div className="col-xl-6"><AnalyticsCard title="Age Group" subtitle="Completed testers by age category."><HorizontalBars data={analytics.ageGroups} /></AnalyticsCard></div>
        <div className="col-xl-6"><AnalyticsCard title="Top Cities" subtitle="Cities represented by completed testers."><HorizontalBars data={analytics.topCities} /></AnalyticsCard></div>
      </div></div>

      <QuestionSection title="Fixed Questions" subtitle="Analytics for Admin-defined fixed questions used in this campaign." emptyText="No fixed-question analytics are available for this campaign." questions={analytics.fixedQuestions} />
    </>}
  </>;
}

function EmptyState({icon,title,text}:{icon:string;title:string;text:string}) {
  return <div className="col-12"><div className="card border-0 shadow-sm"><div className="card-body text-center py-5"><i className={`bi ${icon} fs-1 text-muted`} /><h5 className="mt-3">{title}</h5><p className="text-muted mb-0">{text}</p></div></div></div>;
}

function CampaignHeader({analytics}:{analytics:AnalyticsData}) {
  const c=analytics.campaign;
  return <div className="col-12"><div className="card border-0 shadow-sm mb-4"><div className="card-body"><div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3"><div><div className="small text-muted mb-1">Final Campaign Report</div><h4 className="fw-bold mb-1">{c.productName}</h4><div className="text-muted">{c.campaignCode} · {c.brandName}</div></div><div className="text-lg-end"><div className="small text-muted">Completed</div><div className="fw-semibold">{formatDate(c.completedAt)}</div></div></div></div></div></div>;
}

function SummaryCards({analytics}:{analytics:AnalyticsData}) {
  return <div className="col-12"><div className="row g-3 mb-4">
    <div className="col-lg-4 col-md-6"><div className="card border-0 shadow-sm h-100" style={{background:"#12264A"}}><div className="card-body"><div className="small" style={{color:"#dce5f5"}}>Average Rating</div><div className="d-flex align-items-center gap-2 mt-1"><h2 className="fw-bold text-white mb-0">{analytics.rating.average!==null ? analytics.rating.average.toFixed(2) : "-"}</h2><span className="fs-4" style={{color:"#E6B422"}}>★</span></div></div></div></div>
    <SummaryCard label="Completed Testers" value={analytics.summary.completedTesters} icon="bi-people" />
    <SummaryCard label="Ratings Received" value={analytics.summary.ratedTesters} icon="bi-star" />
  </div></div>;
}

function SummaryCard({label,value,icon}:{label:string;value:number|string;icon:string}) {
  return <div className="col-lg-4 col-md-6"><div className="card border-0 shadow-sm h-100"><div className="card-body d-flex justify-content-between align-items-center"><div><div className="small text-muted">{label}</div><h2 className="fw-bold mb-0 mt-1">{value}</h2></div><div className="fs-2 text-muted"><i className={`bi ${icon}`} /></div></div></div></div>;
}

function AnalyticsCard({title,subtitle,children}:{title:string;subtitle:string;children:React.ReactNode}) {
  return <div className="card border-0 shadow-sm h-100"><div className="card-body"><h5 className="fw-bold mb-1">{title}</h5><p className="small text-muted mb-4">{subtitle}</p>{children}</div></div>;
}

function RatingChart({data}:{data:RatingItem[]}) {
  const maxCount=Math.max(1,...data.map(x=>x.count));
  return <div>{data.slice().sort((a,b)=>b.rating-a.rating).map(item=><div key={item.rating} className="mb-3"><div className="d-flex justify-content-between mb-1"><div className="fw-semibold">{item.rating} <span style={{color:"#E6B422"}}>★</span></div><div className="small text-muted">{item.count} · {item.percentage.toFixed(1)}%</div></div><div className="progress" style={{height:14}}><div
            className="progress-bar"
            title={`${item.rating} Star: ${item.count} tester${item.count===1?"":"s"} (${item.percentage.toFixed(1)}%)`}
            style={{width:`${(item.count/maxCount)*100}%`,background:item.rating>=4?"#1F9D5C":item.rating===3?"#E6B422":"#D4553F",cursor:"help"}}
          /></div></div>)}</div>;
}

function HorizontalBars({data}:{data:DistributionItem[]}) {
  const maxCount=Math.max(1,...data.map(x=>x.count));
  if (!data.length) return <div className="text-muted text-center py-4">No data available.</div>;
  return <div>{data.map(item=><div key={item.label} className="mb-3"><div className="d-flex justify-content-between gap-3 mb-1"><span className="small fw-semibold">{item.label}</span><span className="small text-muted text-nowrap">{item.count} · {item.percentage.toFixed(1)}%</span></div><div className="progress" style={{height:12}}><div
            className="progress-bar bg-primary"
            title={`${item.label}: ${item.count} tester${item.count===1?"":"s"} (${item.percentage.toFixed(1)}%)`}
            style={{width:`${(item.count/maxCount)*100}%`,cursor:"help"}}
          /></div></div>)}</div>;
}

const chartColors=["#1F9D5C","#4A78C2","#E6B422","#D4553F","#7C5CBF","#27A6A1"];
function GenderChart({data}:{data:DistributionItem[]}) {
  if (!data.length) return <div className="text-muted text-center py-4">No gender data available.</div>;

  const total = data.reduce((sum,item)=>sum+item.count,0);
  const radius = 72;
  const circumference = 2 * Math.PI * radius;
  let cumulative = 0;

  return <div className="d-flex flex-column flex-md-row align-items-center justify-content-center gap-4">
    <div className="position-relative flex-shrink-0" style={{width:190,height:190}}>
      <svg width="190" height="190" viewBox="0 0 190 190" role="img" aria-label="Gender distribution">
        <g transform="rotate(-90 95 95)">
          <circle cx="95" cy="95" r={radius} fill="none" stroke="#eef1f5" strokeWidth="34" />
          {data.map((item,index)=>{
            const segmentLength = circumference * (item.percentage / 100);
            const dashOffset = -cumulative;
            cumulative += segmentLength;

            return (
              <circle
                key={item.label}
                cx="95"
                cy="95"
                r={radius}
                fill="none"
                stroke={chartColors[index % chartColors.length]}
                strokeWidth="34"
                strokeDasharray={`${segmentLength} ${Math.max(0,circumference-segmentLength)}`}
                strokeDashoffset={dashOffset}
                style={{cursor:"help"}}
              >
                <title>{`${item.label}: ${item.count} tester${item.count===1?"":"s"} (${item.percentage.toFixed(1)}%)`}</title>
              </circle>
            );
          })}
        </g>
      </svg>

      <div
        className="position-absolute top-50 start-50 translate-middle bg-white rounded-circle d-flex flex-column align-items-center justify-content-center"
        style={{width:105,height:105,pointerEvents:"none"}}
      >
        <strong className="fs-4">{total}</strong>
        <span className="small text-muted">testers</span>
      </div>
    </div>

    <div className="w-100">
      {data.map((item,i)=><div
        key={item.label}
        className="d-flex justify-content-between align-items-center py-2 border-bottom"
        title={`${item.label}: ${item.count} tester${item.count===1?"":"s"} (${item.percentage.toFixed(1)}%)`}
        style={{cursor:"help"}}
      >
        <div className="d-flex align-items-center gap-2">
          <span className="rounded-circle d-inline-block" style={{width:10,height:10,background:chartColors[i%chartColors.length]}} />
          <span>{item.label}</span>
        </div>
        <strong>{item.percentage.toFixed(1)}%</strong>
      </div>)}
    </div>
  </div>;
}

function QuestionSection({title,subtitle,emptyText,questions}:{title:string;subtitle:string;emptyText:string;questions:QuestionAnalytics[]}) {
  return <div className="col-12 mt-4"><div className="mb-3"><h4 className="fw-bold mb-1">{title}</h4><p className="text-muted mb-0">{subtitle}</p></div>{questions.length===0?<div className="card border-0 shadow-sm"><div className="card-body text-center text-muted py-4">{emptyText}</div></div>:<div className="row g-4">{questions.map(q=><div className="col-xl-6" key={q.id}><QuestionChart question={q} /></div>)}</div>}</div>;
}

function QuestionChart({question}:{question:QuestionAnalytics}) {
  return <div className="card border-0 shadow-sm h-100"><div className="card-body"><div className="d-flex justify-content-between align-items-start gap-3 mb-1"><h6 className="fw-bold mb-0">{question.questionText}</h6><span className="badge bg-light text-dark border">{question.responseCount} responses</span></div><div className="small text-muted mb-4">{formatQuestionType(question.questionType)}</div>{question.options.length>0?<div>{question.options.map(opt=><div key={opt.label} className="mb-3"><div className="d-flex justify-content-between gap-3 mb-1"><span className="small fw-semibold">{opt.label}</span><span className="small text-muted text-nowrap">{opt.count} · {opt.percentage.toFixed(1)}%</span></div><div className="progress" style={{height:13}}><div
                  className="progress-bar"
                  title={`${opt.label}: ${opt.count} response${opt.count===1?"":"s"} (${opt.percentage.toFixed(1)}%)`}
                  style={{width:`${Math.min(100,opt.percentage)}%`,background:"#4A78C2",cursor:"help"}}
                /></div></div>)}</div>:<div className="alert alert-light border mb-0">This is a text-response question, so option percentage analytics are not applicable.</div>}</div></div>;
}

function formatQuestionType(value:string) { return value.replaceAll("_"," ").toLowerCase().replace(/\b\w/g,c=>c.toUpperCase()); }
function formatDate(value:string|null) { if (!value) return "-"; const d=new Date(value); if (Number.isNaN(d.getTime())) return "-"; return d.toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}); }
