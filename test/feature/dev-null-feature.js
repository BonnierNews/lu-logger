import { logger } from "../../index.js";

Feature("Logging", () => {
  Scenario("Logging debug with JSON format", () => {
    const message = "Message";
    const data = {
      meta: {
        createdAt: "2017-09-24-00:00T00:00:00.000Z",
        updatedAt: "2017-09-24-00:00T00:00:00.000Z",
        correlationId: "sample-correlation-id",
      },
    };

    When("doing some JSON logging", () => {
      logger.debug(message, data);
    });

    Then("it should not break", () => {});
  });
});
