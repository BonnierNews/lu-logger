import { logger } from "../../index.js";
import { getLastLogAsJson } from "../helpers/test-transport.js";

Feature("Masking of sensitive data", () => {
  Scenario("Logging an api-key as message", () => {
    const message = "x-api-key:8a1ba457-24bc-4941-b136-d401a717c223";

    When("logging a message with an API Key", () => {
      logger.debug(message);
    });

    Then("log output should be trimmed", () => {
      const logContent = getLastLogAsJson();
      logContent.message.should.equal("x-api-key:SECRET");
    });
  });

  Scenario("Logging an apiKey as message", () => {
    const message = "apiKeyGcp:8a1ba457-24bc-4941-b136-d401a717c223";

    When("logging a message with an API Key", () => {
      logger.debug(message);
    });

    Then("log output should be trimmed", () => {
      const logContent = getLastLogAsJson();
      logContent.message.should.equal("apiKeyGcp:SECRET");
    });
  });

  Scenario("Logging a message including basic auth", () => {
    const message = "amqp://user:password@example.com/some-path";

    When("logging a message with an API Key", () => {
      logger.debug(message);
    });

    Then("log output should be trimmed", () => {
      const logContent = getLastLogAsJson();
      logContent.message.should.equal("amqp://uxxx:SECRET@example.com/some-path");
    });
  });

  Scenario("Logging a message including basic auth and an email", () => {
    const message = 'amqp://user:password@example.com/some-path email: "test@example.com"';

    When("logging a message with an API Key", () => {
      logger.debug(message);
    });

    Then("log output should be trimmed", () => {
      const logContent = getLastLogAsJson();
      logContent.message.should.equal('amqp://uxxx:SECRET@example.com/some-path email: "txxx@example.com"');
    });
  });

  Scenario("Logging a reply from credentials", () => {
    const message = "HTTP response for POST https://bn-credentials-production.bnu.bn.nr/credentials/user-lookup";
    const data = JSON.stringify({
      id: "dn://splus/12345678",
      type: "credentials__user",
      attributes: {
        userId: "dn://splus/12345678",
        email: "someemail@something.com",
        verifiedEmail: true,
        lastLogin: "2023-07-02T10:28:10.625Z",
        lastActive: "2023-07-02T10:28:10.625Z",
        properties: {
          firstName: "Some",
          lastName: "Name",
        },
      },
      meta: { correlationId: "9916b873-96e6-44ef-9ef9-529e488907e5" },
    });

    When("logging a message with a response from credentials", () => {
      logger.debug(`${message} ${data}`);
    });

    Then("log output should be trimmed", () => {
      const logContent = getLastLogAsJson();
      logContent.message.should.equal(
        'HTTP response for POST https://bn-credentials-production.bnu.bn.nr/credentials/user-lookup {"id":"dn://splus/12345678","type":"credentials__user","attributes":{"userId":"dn://splus/12345678","email":"sxxx@something.com","verifiedEmail":true,"lastLogin":"2023-07-02T10:28:10.625Z","lastActive":"2023-07-02T10:28:10.625Z","properties":{"firstName":"Sxxx","lastName":"Nxxx"}},"meta":{"correlationId":"9916b873-96e6-44ef-9ef9-529e488907e5"}}'
      );
    });
  });

  Scenario("Logging an auth object as message", () => {
    const message =
      '{"auth":{"user":"some-user","pass":"some-password"},"correlationId":"e91c70da-5156-1234-5678-451e863c1639"}';

    When("logging a message with an auth string", () => {
      logger.debug(message);
    });

    Then("log output should be trimmed", () => {
      const logContent = getLastLogAsJson();
      logContent.message.should.equal('{"auth":"SECRET","correlationId":"e91c70da-5156-1234-5678-451e863c1639"}');
    });
  });

  Scenario("Logging an auth object as message, with escaped quotes", () => {
    const message =
      '{\\"auth\\":{\\"user\\":\\"some-user\\",\\"pass\\":\\"some-password\\"},\\"correlationId\\":\\"e91c70da-5156-1234-5678-451e863c1639\\"}';

    When("logging a message with an auth string", () => {
      logger.debug(message);
    });

    Then("log output should be trimmed", () => {
      const logContent = getLastLogAsJson();
      logContent.message.should.equal(
        '{\\"auth\\":\\"SECRET\\",\\"correlationId\\":\\"e91c70da-5156-1234-5678-451e863c1639\\"}'
      );
    });
  });

  Scenario("Logging an api-key as message, with quotes around the api key, no data", () => {
    const message = '"x-api-key":"8a1ba457-24bc-4941-b136-d401a717c223"';

    When("logging a message with an x-api-key", () => {
      logger.debug(message);
    });

    Then("log output should be trimmed", () => {
      const logContent = getLastLogAsJson();
      logContent.message.should.equal('"x-api-key":"SECRET"');
    });
  });

  Scenario("Stripping email and names from log, no data", () => {
    const message =
      '{"offerCode":"some-offer","email":"some.email@example.com","firstName":"Joe","lastName":"Bloggs","correlationId":"e91c70da-5156-1234-5678-451e863c1639"}';

    When("logging a message with an email and first and last names", () => {
      logger.debug(message);
    });

    Then("log output should be trimmed", () => {
      const logContent = getLastLogAsJson();
      logContent.message.should.equal(
        '{"offerCode":"some-offer","email":"sxxx@example.com","firstName":"Jxxx","lastName":"Bxxx","correlationId":"e91c70da-5156-1234-5678-451e863c1639"}'
      );
    });
  });

  Scenario("Strip token from log", () => {
    const message =
      '/_api/v2/expressen/token/d589b307-a109-4fd1-b621-cc4d5d8f1f32/ {token:d589b307-a109-4fd1-b621-cc4d5d8f1f32} {"token":"d589b307-a109-4fd1-b621-cc4d5d8f1f32"}';

    When("logging a message with some tokens in it", () => {
      logger.debug(message);
    });

    Then("log output should be trimmed", () => {
      const logContent = getLastLogAsJson();
      logContent.message.should.equal('/_api/v2/expressen/token/SECRET/ {token:SECRET} {"token":"SECRET"}');
    });
  });

  Scenario("Strip access_token from log", () => {
    const message =
      '/_api/v2/expressen/token/d589b307-a109-4fd1-b621-cc4d5d8f1f32/ {"access_token":"d589b307-a109-4fd1-b621-cc4d5d8f1f32"}';

    When("logging a message with an access_token in it", () => {
      logger.debug(message);
    });

    Then("log output should be trimmed", () => {
      const logContent = getLastLogAsJson();
      logContent.message.should.equal('/_api/v2/expressen/token/SECRET/ {"access_token":"SECRET"}');
    });
  });

  Scenario("Strip token from log, calling an endpoint", () => {
    const message =
      'HTTP GET, https://example.com/customer-token/v1/tokens/d589b307-a109-4fd1-b621-cc4d5d8f1f32, params: {"something": "param"}';

    When("logging a message with a URL containing tokens", () => {
      logger.debug(message);
    });

    Then("log output should be trimmed", () => {
      const logContent = getLastLogAsJson();
      logContent.message.should.equal(
        'HTTP GET, https://example.com/customer-token/v1/tokens/SECRET, params: {"something": "param"}'
      );
    });
  });

  Scenario("Logging a message including a password", () => {
    const message = 'Some message "password": "some-password" blablabla';

    When("logging a message with an API Key", () => {
      logger.debug(message);
    });

    Then("log output should be trimmed", () => {
      const logContent = getLastLogAsJson();
      logContent.message.should.equal('Some message "password": "SECRET" blablabla');
    });
  });

  Scenario("Logging a message including a secret", () => {
    const message = 'Some message "client_secret": "some-secret" blablabla';

    When("logging a message with an API Key", () => {
      logger.debug(message);
    });

    Then("log output should be trimmed", () => {
      const logContent = getLastLogAsJson();
      logContent.message.should.equal('Some message "client_secret": "SECRET" blablabla');
    });
  });

  Scenario("Logging a message including an access_token", () => {
    const message = 'Some message "access_token": "some-secret" blablabla';

    When("logging a message with an API Key", () => {
      logger.debug(message);
    });

    Then("log output should be trimmed", () => {
      const logContent = getLastLogAsJson();
      logContent.message.should.equal('Some message "access_token": "SECRET" blablabla');
    });
  });
});
