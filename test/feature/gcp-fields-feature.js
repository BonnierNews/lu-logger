import { logger } from "../../index.js";
import { getLastLogAsJson } from "../helpers/test-transport.js";

Feature("Logging", () => {
  Scenario("Logging with GCP special field", () => {
    When("logging with", () => {
      logger.info("Some message", { correlationId: "some-epic-id", "logging.googleapis.com/trace": "some-epic-trace-id" });
    });

    Then("log output should be JSON", () => {
      const logContent = getLastLogAsJson();
      logContent.metaData.should.deep.equal({ correlationId: "some-epic-id" });
      logContent["logging.googleapis.com/trace"].should.equal("some-epic-trace-id");
    });
  });
});
