import { cookies } from "next/headers";
import { ContactClient } from "./contact-client";

export const metadata = {
  title: "Contact Us - Marketly AI",
  description: "Get in touch with the Marketly AI team.",
};

export default async function ContactPage() {
  const cookieStore = await cookies();
  const isAuthenticated = !!cookieStore.get("marketly_access")?.value;

  return <ContactClient isAuthenticated={isAuthenticated} />;
}
