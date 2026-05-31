export type Status = "active" | "draft" | "queued" | "paused" | "failed";

export type Metric = {
  label: string;
  value: string;
  delta: string;
  tone: "success" | "warning" | "danger" | "neutral";
};

export type SelectOption = {
  label: string;
  value: string;
};
