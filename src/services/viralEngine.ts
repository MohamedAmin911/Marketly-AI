import type { ViralEngineRequest, ViralEngineResponse } from "@/types/viral-engine";

export async function generateViralEngine(payload: ViralEngineRequest, retries = 1): Promise<ViralEngineResponse> {
  const attemptFetch = async (): Promise<Response> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000); // 90 seconds timeout

    try {
      const response = await fetch("/api/viral-engine", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  };

  try {
    let response = await attemptFetch();

    if (!response.ok && retries > 0) {
      console.warn("Viral engine request failed, retrying once...");
      response = await attemptFetch();
    }

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    let data = await response.json();
    
    // n8n often wraps the JSON response in an array like [ { viralEngine: {...} } ]
    if (Array.isArray(data) && data.length > 0 && data[0].viralEngine) {
      data = data[0];
    }
    
    if (!data.viralEngine) {
      throw new Error(data.message || "Invalid response format from webhook");
    }

    return data;
  } catch (error: any) {
    if (error.name === "AbortError") {
      throw new Error("The request timed out after 90 seconds. Please try again.");
    }
    
    if (retries > 0) {
      console.warn("Network error, retrying once...");
      return generateViralEngine(payload, retries - 1);
    }
    
    throw error;
  }
}
