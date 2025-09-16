import { match } from "ts-pattern";

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);

    this.name = "ApiError";
    this.status = status;
  }

  toContext = (context: string): string =>
    match(this.status)
      .with(401, () =>
        JSON.stringify({
          description: `Authentication failed for ${context}`,
          suggestions: [
            "Check that your WOODPECKER_TOKEN environment variable is set correctly",
            "Verify the token has not expired",
            "Ensure the token has sufficient permissions",
          ],
          error: "AUTH_ERROR",
        })
      )
      .with(403, () =>
        JSON.stringify({
          description: `Access denied for ${context}`,
          suggestions: [
            "Check that you have permission to access this resource",
            "Verify the repository/pipeline exists and is accessible",
            "Contact your Woodpecker CI administrator if needed",
          ],
          error: "PERMISSION_ERROR",
        })
      )
      .with(404, () =>
        JSON.stringify({
          description: `Resource not found for ${context}`,
          suggestions: [
            "Double-check the repository name, pipeline number, or step ID",
            "Verify the resource exists and hasn't been deleted",
          ],
          error: "NOT_FOUND",
        })
      )
      .with(429, () =>
        JSON.stringify({
          description: `Rate limit exceeded for ${context}`,
          suggestions: [
            "Wait a moment before retrying",
            "Consider reducing the frequency of requests",
          ],
          error: "RATE_LIMIT",
        })
      )
      .with(500, 502, 503, 504, () =>
        JSON.stringify({
          description: `Woodpecker CI server error for ${context}`,
          suggestions: [
            "Try again in a few moments",
            "Check Woodpecker CI server status",
            "Contact your administrator if the issue persists",
          ],
          error: "SERVER_ERROR",
        })
      )
      .otherwise(() =>
        JSON.stringify({
          description: `Request failed for ${context}: ${this.message}`,
          suggestions: [
            "Check your network connection",
            "Verify the Woodpecker CI server URL is correct",
            "Try again in a few moments",
          ],
          error: "UNKNOWN_ERROR",
        })
      );
}
