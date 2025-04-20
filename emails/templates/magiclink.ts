import { Template } from "../types";

const defaultContent = {
  subject: "Sign in to your Iffy account",
  heading: "Sign in to your Iffy account",
  body: `Hey,\n\nClick the button below to securely sign in to your Iffy account.\n\nIf the button doesn’t work, you can also copy and paste the following link into your browser:\n\n{{ LOGIN_LINK }}\n\nThanks for using Iffy!`,
};

export default {
  defaultContent,
} satisfies Template;
