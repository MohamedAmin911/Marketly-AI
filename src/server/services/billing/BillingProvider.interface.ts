export interface BillingProvider {
  /**
   * Initializes a checkout session for upgrading a subscription
   */
  createSubscriptionCheckout(userId: string, planId: string, successUrl: string, cancelUrl: string): Promise<string>;

  /**
   * Initializes a checkout session for purchasing a one-time credit pack
   */
  createCreditPackCheckout(userId: string, packId: string, successUrl: string, cancelUrl: string): Promise<string>;

  /**
   * Cancels an active subscription
   */
  cancelSubscription(subscriptionId: string): Promise<boolean>;

  /**
   * Resumes a canceled subscription (if before end of billing period)
   */
  resumeSubscription(subscriptionId: string): Promise<boolean>;

  /**
   * Upgrades or downgrades an existing subscription
   */
  changeSubscription(subscriptionId: string, newPlanId: string): Promise<boolean>;

  /**
   * Fetches the latest billing portal URL for the user to manage their billing
   */
  getBillingPortalUrl(userId: string, returnUrl: string): Promise<string>;
}
