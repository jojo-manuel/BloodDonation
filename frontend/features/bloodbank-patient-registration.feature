Feature: Blood Bank Patient Registration
  As a blood bank user
  I want to register patients requiring blood transfusion
  So that I can manage blood requests and track patient requirements

  Background:
    Given I am logged in as a blood bank user
    And I am on the blood bank patient registration page

  @smoke @critical
  Scenario: Successfully register a new patient with all valid details
    When I enter the following patient details:
      | Field           | Value              |
      | Patient Name    | Rajesh Kumar       |
      | Blood Group     | A+                 |
      | MRID            | MR2024001          |
      | Phone Number    | 9876543210         |
      | Required Units  | 2                  |
      | Address         | 123 MG Road, Kochi |
    And I select a future date for blood requirement
    And I submit the patient registration form
    Then I should see a success message "Patient registered successfully"
    And I should be redirected to the patient management page
    And the new patient should appear in the patients list

  @validation
  Scenario: Attempt to register patient with missing required fields
    When I leave all fields empty
    And I submit the patient registration form
    Then I should see validation error messages
    And I should remain on the registration page
    And the form should not be submitted

  @validation
  Scenario: Register patient with invalid phone number format
    When I enter the following patient details:
      | Field           | Value                  |
      | Patient Name    | Priya Sharma           |
      | Blood Group     | B+                     |
      | MRID            | MR2024002              |
      | Phone Number    | 12345                  |
      | Required Units  | 1                      |
      | Address         | 456 Park Street, Delhi |
    And I select a future date for blood requirement
    And I submit the patient registration form
    Then I should see an error message about invalid phone number format
    And the form should not be submitted

  @validation
  Scenario: Register patient with past date requirement
    When I enter the following patient details:
      | Field           | Value                    |
      | Patient Name    | Amit Patel               |
      | Blood Group     | O+                       |
      | MRID            | MR2024003                |
      | Phone Number    | 9988776655               |
      | Required Units  | 3                        |
      | Address         | 789 Lake Road, Mumbai    |
    And I select a past date for blood requirement
    And I submit the patient registration form
    Then I should see an error message about invalid date
    And the form should not be submitted

  @validation
  Scenario: Register patient with zero or negative units
    When I enter the following patient details:
      | Field           | Value                    |
      | Patient Name    | Sunita Reddy             |
      | Blood Group     | AB+                      |
      | MRID            | MR2024004                |
      | Phone Number    | 9123456789               |
      | Required Units  | 0                        |
      | Address         | 321 Beach Road, Chennai  |
    And I select a future date for blood requirement
    And I submit the patient registration form
    Then I should see an error message about minimum units requirement
    And the form should not be submitted

  @bloodgroups
  Scenario: Verify all blood groups are available in dropdown
    Then the blood group dropdown should contain the following options:
      | A+  |
      | A-  |
      | B+  |
      | B-  |
      | O+  |
      | O-  |
      | AB+ |
      | AB- |

  @ui
  Scenario: Verify form fields and layout
    Then I should see the following form fields:
      | Patient Name    |
      | Blood Group     |
      | MRID            |
      | Phone Number    |
      | Required Units  |
      | Required Date   |
      | Address         |
    And all required fields should be marked as mandatory
    And I should see a submit button labeled "Register Patient"
    And I should see a cancel button

  @workflow
  Scenario: Register multiple patients in sequence
    When I register a patient with MRID "MR2024005" and name "Ananya Singh"
    Then I should see a success message
    When I navigate back to patient registration page
    And I register a patient with MRID "MR2024006" and name "Vikram Malhotra"
    Then I should see a success message
    And both patients should appear in the patients list

  @validation
  Scenario: Attempt to register patient with duplicate phone number
    Given a patient with phone number "9111222333" already exists
    When I enter the following patient details:
      | Field           | Value                       |
      | Patient Name    | Duplicate Test              |
      | Blood Group     | A-                          |
      | MRID            | MR2024007                   |
      | Phone Number    | 9111222333                  |
      | Required Units  | 2                           |
      | Address         | Test Address                |
    And I select a future date for blood requirement
    And I submit the patient registration form
    Then I should see an error message about duplicate phone number

  @data
  Scenario: Register patient with maximum valid units
    When I enter the following patient details:
      | Field           | Value                       |
      | Patient Name    | Critical Patient            |
      | Blood Group     | O-                          |
      | MRID            | MR2024008                   |
      | Phone Number    | 9999888877                  |
      | Required Units  | 10                          |
      | Address         | Emergency Ward, Hospital    |
    And I select a future date for blood requirement
    And I submit the patient registration form
    Then I should see a success message "Patient registered successfully"

  @ui
  Scenario: Verify form clears after successful submission
    When I enter the following patient details:
      | Field           | Value                  |
      | Patient Name    | Form Clear Test        |
      | Blood Group     | B-                     |
      | MRID            | MR2024009              |
      | Phone Number    | 9876512345             |
      | Required Units  | 1                      |
      | Address         | Clear Test Address     |
    And I select a future date for blood requirement
    And I submit the patient registration form
    Then I should see a success message
    And I should be redirected to the patient management page

  @accessibility
  Scenario: Verify form accessibility features
    Then all form fields should have proper labels
    And required fields should be marked with asterisk or "required" attribute
    And the submit button should be keyboard accessible
    And the form should support tab navigation

  @edge-case
  Scenario: Register patient with special characters in name
    When I enter the following patient details:
      | Field           | Value                       |
      | Patient Name    | Dr. O'Brien-Smith Jr.       |
      | Blood Group     | AB-                         |
      | MRID            | MR2024010                   |
      | Phone Number    | 9876543211                  |
      | Required Units  | 2                           |
      | Address         | 123 Main St., Apt. 4B       |
    And I select a future date for blood requirement
    And I submit the patient registration form
    Then I should see a success message "Patient registered successfully"

  @cancel
  Scenario: Cancel patient registration
    When I enter some patient details
    And I click the cancel button
    Then I should be redirected to the patient management page
    And no patient should be registered

  @loading
  Scenario: Verify loading state during form submission
    When I enter valid patient details
    And I submit the patient registration form
    Then the submit button should show a loading state
    And the submit button should be disabled during submission
    And I should not be able to submit the form again until completion

