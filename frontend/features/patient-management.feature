Feature: Patient Management by Blood Bank
  As a blood bank administrator
  I want to add and manage patient records
  So that I can track blood requests and fulfill patient needs

  Background:
    Given I am logged in as a blood bank user with email "bloodbank@gmail.com"
    And I am on the blood bank dashboard

  @smoke @patient
  Scenario: Add a new patient record
    When I navigate to "Add Patient" section
    And I fill in the patient form:
      | field                  | value                |
      | Patient Name           | Rahul Kumar          |
      | MR ID                  | MR20250001          |
      | Age                    | 35                   |
      | Gender                 | Male                 |
      | Blood Group Required   | O+                   |
      | Contact Number         | 9876543210          |
      | Hospital               | General Hospital     |
      | Doctor Name            | Dr. Smith            |
      | Required Units         | 2                    |
      | Urgency                | High                 |
      | Medical Condition      | Surgery              |
    And I submit the patient form
    Then I should see "Patient added successfully" message
    And the patient should appear in the patient list
    And the patient should have a unique MR ID

  @critical @patient
  Scenario: Search patient by MR ID
    Given multiple patients exist in the system
    When I enter MR ID "MR20250001" in the search box
    And I click the search button
    Then I should see the patient details
    And the details should include:
      | information           |
      | Patient Name          |
      | Blood Group           |
      | Contact Number        |
      | Hospital              |
      | Request Status        |
      | Required Units        |

  @patient
  Scenario: Update patient information
    Given a patient with MR ID "MR20250001" exists
    When I search for the patient
    And I click "Edit Patient Details"
    And I update the following fields:
      | field           | new value        |
      | Contact Number  | 9999888877      |
      | Required Units  | 3                |
      | Urgency         | Critical         |
    And I save the changes
    Then I should see "Patient updated successfully" message
    And the updated information should be displayed

  @patient @fulfillment
  Scenario: Mark patient request as fulfilled
    Given a patient request is pending
    When I search for the patient by MR ID
    And I click "Mark as Fulfilled"
    And I enter fulfillment details:
      | field                | value          |
      | Donor Name           | John Doe       |
      | Units Provided       | 2              |
      | Date Fulfilled       | 2025-10-25     |
      | Blood Bank Reference | BB2025001      |
    And I confirm the fulfillment
    Then the patient status should change to "Fulfilled"
    And the patient should be notified
    And the record should be archived

  @patient @validation
  Scenario: Validate MR ID uniqueness
    Given a patient with MR ID "MR20250001" exists
    When I try to add a new patient with the same MR ID
    And I submit the patient form
    Then I should see "MR ID already exists" error
    And the patient should not be added
    And I should be prompted to use a different MR ID

  @patient
  Scenario: Filter patients by status
    Given multiple patients exist with different statuses
    When I select status filter "Pending"
    And I apply the filter
    Then I should see only patients with "Pending" status
    And the count should match the filtered results

  @patient
  Scenario: View patient request history
    Given a patient with multiple requests exists
    When I search for the patient
    And I click "View History"
    Then I should see all previous requests
    And each request should show:
      | information      |
      | Request Date     |
      | Blood Group      |
      | Units Required   |
      | Status           |
      | Fulfilled By     |
      | Fulfillment Date |

  @patient @dropdown
  Scenario: Auto-populate patient details from dropdown
    When I navigate to "Add Patient" section
    And I click on the patient name dropdown
    And I select a patient from the dropdown
    Then the patient's existing details should auto-populate:
      | field          |
      | MR ID          |
      | Age            |
      | Blood Group    |
      | Contact Number |
      | Hospital       |

  @patient @bulk
  Scenario: Export patient records
    Given multiple patients exist in the system
    When I select patients to export
    And I click "Download Report"
    Then a PDF report should be generated
    And the report should contain all selected patient details

  @patient
  Scenario Outline: Add patients with different blood groups
    When I add a patient requiring blood group "<bloodGroup>"
    And I fill in other mandatory fields
    And I submit the patient form
    Then the patient should be added successfully
    And blood group should be "<bloodGroup>"

    Examples:
      | bloodGroup |
      | A+         |
      | B+         |
      | O+         |
      | AB+        |
      | A-         |
      | B-         |
      | O-         |
      | AB-        |

  @patient @tracking
  Scenario: Track patient fulfillment metrics
    When I navigate to "Analytics" section
    Then I should see blood bank statistics:
      | metric                    |
      | Total Patients Added      |
      | Pending Requests          |
      | Fulfilled Requests        |
      | Cancelled Requests        |
      | Average Fulfillment Time  |
      | Most Requested Blood Type |

