# Selenium Automation Tests for Blood Donation System

This project is set up to write and run Selenium UI tests for the Blood Donation project using Java. It uses Maven for dependency management and TestNG as the testing framework.

## Project Structure
* `pom.xml`: Maven dependencies configuration (Selenium, TestNG).
* `src/test/java/com/blooddonation/tests/BaseTest.java`: Abstract Test class that sets up Chrome WebDriver (with implicit wait and maximized mode).
* `src/test/java/com/blooddonation/tests/LoginTest.java`: Example implementation of login scenarios using TestNG.
* `testng.xml`: TestNG suite runner file.

## Setup in IntelliJ IDEA
Since you requested testing via IntelliJ IDEA, follow these steps to integrate and run the tests:

1. **Open IntelliJ IDEA**
2. In IntelliJ, click on `File` -> `Open...` (or `Open` on the welcome screen).
3. Navigate to and select the `d:\BloodDonation\selenium-tests` folder (where this `pom.xml` is located). Click **OK**.
4. IntelliJ should ask you if you want to **open it as a project or a file**, or just detect the `pom.xml`. If a popup appears saying `Maven build scripts found`, select **Load Maven Project**.
5. Wait for IntelliJ to download dependencies (Selenium Java, TestNG) in the background.

## Running Tests
Once setup is complete:
1. Open `LoginTest.java` in the IDE.
2. Next to the class definition or next to each `@Test` method (e.g., `testSuccessfulLogin`), you will see a green **Run (Play button)** icon in the gutter on the left. Click it to run your test.
3. Alternatively, right-click on `testng.xml` and select **Run '...\testng.xml'**.

## Pre-requisites
- Ensure that your frontend React app is running (e.g. `npm run dev` at port 3000) so that `<Base URL>/login` is accessible on Chrome.
- In `BaseTest.java`, modify the `baseUrl` property if your frontend is running on a different port like `5173`.
- In `LoginTest.java`, modify Xpaths and selectors so they exactly match your UI forms.
