/**
 * Cloudflare API Integration
 * Handles domain blocking/whitelisting through Cloudflare Firewall Rules
 */

const CLOUDFLARE_API_URL = "https://api.cloudflare.com/client/v4";

// Get API token dynamically (not at module load time)
function getApiToken(): string {
  const token = process.env.CLOUDFLARE_API_TOKEN;
  if (!token) {
    throw new Error("CLOUDFLARE_API_TOKEN not configured in environment variables");
  }
  return token;
}

interface CloudflareError {
  code: number;
  message: string;
}

interface CloudflareRule {
  id: string;
  name: string;
  expression: string;
  action: string;
}

/**
 * Creates a firewall rule in Cloudflare to block a domain
 * @param zoneId - Cloudflare Zone ID (get from account)
 * @param domain - Domain to block (e.g., facebook.com)
 * @param ruleName - Human-readable name for the rule
 * @returns Rule ID or error
 */
export async function createBlockRule(
  zoneId: string,
  domain: string,
  ruleName: string
): Promise<{ success: boolean; ruleId?: string; error?: string }> {
  try {
    const token = getApiToken();
    console.log(`[Cloudflare] Creating block rule for ${domain}`);
    console.log(`[Cloudflare] Token length: ${token?.length || 0}, Zone: ${zoneId}`);

    // Sanitize domain name for rule name (max 255 chars)
    const safeDomain = domain.replace(/[^a-zA-Z0-9.-]/g, "");
    const finalRuleName = `BLOCK-${safeDomain.substring(0, 240)}`;

    // Create expression to match the domain
    // Matches: domain.com, www.domain.com, subdomain.domain.com
    const expression = `(cf.http.request.uri.host eq "${domain}" or cf.http.request.uri.host contains ".${domain}")`;

    // Use the correct Cloudflare expression syntax for Rulesets
    const cfExpression = `(http.host eq "${domain}" or http.host contains ".${domain}")`;
    
    const response = await fetch(
      `${CLOUDFLARE_API_URL}/zones/${zoneId}/rulesets`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: finalRuleName,
          description: `Auto-generated rule to block ${domain}`,
          kind: "zone",
          phase: "http_request_firewall",
          rules: [
            {
              action: "block",
              expression: cfExpression,
              description: `Block ${domain}`,
            }
          ]
        }),
      }
    );

    const data = await response.json() as any;

    if (!response.ok || !data.success) {
      const error = data.errors?.[0] || { message: "Unknown error" };
      console.error(`[Cloudflare] Error creating rule for ${domain}:`, {
        status: response.status,
        errorMessage: error.message,
        fullError: data.errors,
        token: token ? `${token.substring(0, 10)}...` : 'MISSING'
      });
      return {
        success: false,
        error: `Cloudflare: ${error.message}`,
      };
    }

    console.log(`[Cloudflare] Successfully created rule for ${domain}, Rule ID: ${data.result?.id}`);
    return {
      success: true,
      ruleId: data.result?.id,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[Cloudflare] Exception creating rule for ${domain}:`, message);
    return {
      success: false,
      error: `Failed to create rule: ${message}`,
    };
  }
}

/**
 * Deletes a firewall rule from Cloudflare
 * @param zoneId - Cloudflare Zone ID
 * @param ruleId - Rule ID to delete (actually ruleset ID)
 * @returns Success status or error
 */
export async function deleteBlockRule(
  zoneId: string,
  ruleId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const token = getApiToken();

    const response = await fetch(
      `${CLOUDFLARE_API_URL}/zones/${zoneId}/rulesets/${ruleId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json() as any;

    if (!response.ok || !data.success) {
      const error = data.errors?.[0] || { message: "Unknown error" };
      return {
        success: false,
        error: `Cloudflare: ${error.message}`,
      };
    }

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return {
      success: false,
      error: `Failed to delete rule: ${message}`,
    };
  }
}

/**
 * Gets zone information from Cloudflare
 * Useful for testing connection and getting Zone ID
 * @returns Zone information or error
 */
export async function getZoneInfo(zoneId: string): Promise<{
  success: boolean;
  zone?: any;
  error?: string;
}> {
  try {
    const token = getApiToken();

    const response = await fetch(
      `${CLOUDFLARE_API_URL}/zones/${zoneId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json() as any;

    if (!response.ok || !data.success) {
      const error = data.errors?.[0] || { message: "Unknown error" };
      return {
        success: false,
        error: `Cloudflare: ${error.message}`,
      };
    }

    return {
      success: true,
      zone: data.result,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return {
      success: false,
      error: `Failed to get zone info: ${message}`,
    };
  }
}

/**
 * Lists all firewall rules for a zone
 * Useful for debugging and monitoring
 */
export async function listRules(zoneId: string): Promise<{
  success: boolean;
  rules?: CloudflareRule[];
  error?: string;
}> {
  try {
    const token = getApiToken();

    const response = await fetch(
      `${CLOUDFLARE_API_URL}/zones/${zoneId}/firewall/rules?per_page=100`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json() as any;

    if (!response.ok || !data.success) {
      const error = data.errors?.[0] || { message: "Unknown error" };
      return {
        success: false,
        error: `Cloudflare: ${error.message}`,
      };
    }

    return {
      success: true,
      rules: data.result,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return {
      success: false,
      error: `Failed to list rules: ${message}`,
    };
  }
}
