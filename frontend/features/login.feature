Feature: User Login
  As a user of the Blood Donation System
  I want to be able to login to my account
  So that I can access my dashboard and manage blood donation requests

  Background:
    Given I am on the login page

  Scenario: Successfully load the login page
    Then I should see the login form
    And I should see the email input field
    And I should see the password input field
    And I should see the submit button

  Scenario: Login with valid credentials
    When I enter email "jeevan@gmail.com"
    And I enter password "Jeevan123!@#"
    And I click the login button
    Then I should be redirected to the dashboard
    And I should not be on the login page

  Scenario: Login with invalid credentials
    When I enter email "invalid@example.com"
    And I enter password "wrongpassword"
    And I click the login button
    Then I should see an error alert
    And the alert should contain "Login Failed"

  Scenario: Attempt to login with empty fields
    When I click the login button without entering credentials
    Then I should remain on the login page
    And the form should show validation errors

  Scenario: Navigate to forgot password
    When I click on "Forgot your password?" link
    Then I should see the password reset form
    And I should see the reset email input field

  Scenario: Check Firebase login option
    Then I should see the Firebase login button
    And the Firebase button should be visible

  Scenario: Verify form field requirements
    Then the email field should be required
    And the password field should be required

  Scenario: Check navigation elements
    Then I should see the "Back to Home" link
    And the link should point to the home page

  Scenario Outline: Login with multiple valid users
    When I enter email "<email>"
    And I enter password "<password>"
    And I click the login button
    Then I should be redirected to the dashboard

    Examples:
      | email                | password        |
      | jeevan@gmail.com     | Jeevan123!@#    |
      | test@example.com     | Test123!@#      |
      | abhi@gmail.com       | AbhiPassword123!|

  Scenario: Check password field security
    When I enter password "secretpassword"
    Then the password field should hide the password text

  Scenario: Verify page title and branding
    Then the page should display "Blood Donation" branding
    And the page should have proper styling

