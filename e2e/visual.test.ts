import { shortest } from "@antiwork/shortest";

const loginEmail = `shortest+clerk_test@${process.env.MAILOSAUR_SERVER_ID}.mailosaur.net`;
shortest("Log in", { email: loginEmail });

shortest("Check the Dashboard Moderations UI at /dashboard/moderations")
  .expect("Verify sidebar navigation and table headers are present")
  .expect("Confirm table has Record, Status, Via, Entity, and Created At columns")
  .expect("Verify AI appears in the Via column")
  .expect("Check Product appears in the Entity column")
  .expect("Confirm timestamps have format 'MMM D, hh:mm A'");

shortest("Verify moderation statuses")
  .expect("Check Flagged items show red indicators and violation reasons")
  .expect("Ensure Compliant items are properly marked");
