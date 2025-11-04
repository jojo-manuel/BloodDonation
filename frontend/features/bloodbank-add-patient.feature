Feature: Blood Bank Add Patient
  As a blood bank user
  I want to add patients requiring blood transfusion
  So that I can manage blood requests and track patient requirements

  Background:
    Given I am logged in as a blood bank user
    And I am on the blood bank dashboard
    And I navigate to the patients tab

  @bloodbank @patient @critical
  Scenario: Blood bank successfully adds a new patient with all valid details
    When I fill in the patient form with:
      | Field           | Value              |
      | Patient Name    | Rajesh Kumar       |
      | Blood Group     | A+                 |
      | MRID            | MR2024001          |
      | Phone Number    | 9876543210         |
      | Required Units  | 2                  |
      | Address         | 123 MG Road, Kochi |
    And I select a future date for blood requirement
    And I submit the patient form
    Then I should see a success message indicating patient was added
    And the patient should appear in the patients list
    And the form should be cleared

  @bloodbank @patient @critical
  Scenario: Blood bank adds patient with different blood group
    When I fill in the patient form with:
      | Field           | Value                    |
      | Patient Name    | Priya Sharma             |
      | Blood Group     | O+                       |
      | MRID            | MR2024002                |
      | Phone Number    | 9876543211               |
      | Required Units  | 3                        |
      | Address         | 456 Park Street, Delhi   |
    And I select a future date for blood requirement
    And I submit the patient form
    Then I should see a success message indicating patient was added
    And the patient should appear in the patients list

  @bloodbank @patient @validation
  Scenario: Blood bank attempts to add patient with missing required fields
    When I leave all patient form fields empty
    And I submit the patient form
    Then I should see validation error messages
    And the form should not be submitted
    And I should remain on the dashboard

  @bloodbank @patient @validation
  Scenario: Blood bank attempts to add patient with invalid phone number
    When I fill in the patient form with:
      | Field           | Value                    |
      | Patient Name    | Invalid Phone Test        |
      | Blood Group     | B+                       |
      | MRID            | MR2024003                |
      | Phone Number    | 12345                    |
      | Required Units  | 1                        |
      | Address         | Test Address             |
    And I select a future date for blood requirement
    And I submit the patient form
    Then I should see an error message about invalid phone number format
    And the form should not be submitted

  @bloodbank @patient @validation
  Scenario: Blood bank attempts to add patient with zero units
    When I fill in the patient form with:
      | Field           | Value                    |
      | Patient Name    | Zero Units Test           |
      | Blood Group     | AB+                      |
      | MRID            | MR2024004                 |
      | Phone Number    | 9876543212               |
      | Required Units  | 0                        |
      | Address         | Test Address             |
    And I select a future date for blood requirement
    And I submit the patient form
    Then I should see an error message about minimum units requirement
    And the form should not be submitted

  @bloodbank @patient @validation
  Scenario: Blood bank attempts to add patient with duplicate MRID
    Given a patient with MRID "MR2024005" already exists
    When I fill in the patient form with:
      | Field           | Value                    |
      | Patient Name    | Duplicate MRID Test       |
      | Blood Group     | A-                       |
      | MRID            | MR2024005                 |
      | Phone Number    | 9876543213               |
      | Required Units  | 2                        |
      | Address         | Test Address             |
    And I select a future date for blood requirement
    And I submit the patient form
    Then I should see an error message about duplicate MRID
    And the form should not be submitted

  @bloodbank @patient @ui
  Scenario: Blood bank verifies patient form fields are present
    Then I should see the following form fields:
      | Patient Name    |
      | Blood Group     |
      | MRID            |
      | Phone Number    |
      | Required Units  |
      | Required Date   |
      | Address         |
    And all required fields should be marked as mandatory
    And I should see a submit button for adding patient

  @bloodbank @patient @workflow
  Scenario: Blood bank adds multiple patients in sequence
    When I add a patient with name "Ananya Singh" and MRID "MR2024006"
    Then I should see a success message
    When I add another patient with name "Vikram Malhotra" and MRID "MR2024007"
    Then I should see a success message
    And both patients should appear in the patients list

  @bloodbank @patient @ui
  Scenario: Blood bank verifies form clears after successful submission
    When I fill in the patient form with:
      | Field           | Value                  |
      | Patient Name    | Form Clear Test        |
      | Blood Group     | B-                     |
      | MRID            | MR2024008              |
      | Phone Number    | 9876543214             |
      | Required Units  | 1                      |
      | Address         | Clear Test Address     |
    And I select a future date for blood requirement
    And I submit the patient form
    Then I should see a success message
    And the form fields should be cleared

  @bloodbank @patient @date
  Scenario: Blood bank adds patient with urgent requirement (today's date)
    When I fill in the patient form with:
      | Field           | Value                    |
      | Patient Name    | Urgent Patient            |
      | Blood Group     | O-                       |
      | MRID            | MR2024009                |
      | Phone Number    | 9876543215               |
      | Required Units  | 5                        |
      | Address         | Emergency Ward           |
    And I select today's date for blood requirement
    And I submit the patient form
    Then I should see a success message indicating patient was added
    And the patient should appear in the patients list

