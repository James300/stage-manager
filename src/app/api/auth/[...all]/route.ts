import { getAuth } from "@/lib/auth";

async function handleAuthRequest(request: Request) {
  return getAuth().handler(request);
}

export {
  handleAuthRequest as GET,
  handleAuthRequest as POST,
  handleAuthRequest as PATCH,
  handleAuthRequest as PUT,
  handleAuthRequest as DELETE,
};
