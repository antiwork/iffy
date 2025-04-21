import { Template } from "../types";

const defaultContent = {
  subject: "You’ve been invited to join {{ ORGANIZATION_NAME }}",
  heading: "You're invited to join {{ ORGANIZATION_NAME }} on Iffy",
  body: `Hey,\n\nYou’ve been invited to join the {{ ORGANIZATION_NAME }} organization on Iffy as an {{ ORGANIZATION_ROLE }}.\n\nClick the button below to accept your invite and get started:\n\n{{ INVITE_LINK }}\n\nLooking forward to having you on board!\n\n`,
};

export default {
  defaultContent,
} satisfies Template;
