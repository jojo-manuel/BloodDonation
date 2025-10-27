Feature: Patient Registration
  As a user of the Blood Donation System
  I want to register patients requiring blood transfusion
  So that they can receive the blood they need

  Background:
    Given I am on the patient registration page

  Scenario: Successfully load the patient registration page
    Then I should see the patient registration form
    And I should see the page title "Register New Patient"
    And I should see all required form fields
    And I should see the submit button

  Scenario: Register a new patient with valid data
    When I enter patient name "John Doe"
    And I select blood group "A+"
    And I enter MRID "MR12345"
    And I enter phone number "9876543210"
    And I enter required units "2"
    And I select future date for requirement
    And I enter address "123 Main Street, City, State"
    And I click the register patient button
    Then I should see a success message
    And I should be redirected to patient management page

  Scenario: Attempt to register patient with empty fields
    When I click the register patient button without entering data
    Then I should remain on the registration page
    And I should see validation errors

  Scenario: Register patient with invalid phone number
    When I enter patient name "Jane Smith"
    And I select blood group "B+"
    And I enter MRID "MR54321"
    And I enter phone number "123"
    And I enter required units "1"
    And I select future date for requirement
    And I enter address "456 Oak Street"
    And I click the register patient button
    Then I should see an error about invalid phone number

  Scenario: Register patient with past date
    When I enter patient name "Bob Johnson"
    And I select blood group "O+"
    And I enter MRID "MR99999"
    And I enter phone number "9999999999"
    And I enter required units "3"
    And I select past date for requirement
    And I enter address "789 Pine Avenue"
    And I click the register patient button
    Then I should see an error about invalid date

  Scenario: Verify all blood groups are available
    Then I should see blood group option "A+"
    And I should see blood group option "A-"
    And I should see blood group option "B+"
    And I should see blood group option "B-"
    And I should see blood group option "AB+"
    And I should see blood group option "AB-"
    And I should see blood group option "O+"
    And I should see blood group option "O-"

  Scenario: Verify form field validations
    Then the patient name field should be required
    And the blood group field should be required
    And the MRID field should be required
    And the phone number field should be required
    And the units required field should be required
    And the date needed field should be required
    And the address field should be required

  Scenario: Cancel registration and navigate back
    When I click the cancel button
    Then I should be redirected to patient management page

  Scenario: Verify minimum units requirement
    When I enter patient name "Test Patient"
    And I select blood group "AB+"
    And I enter MRID "MR11111"
    And I enter phone number "8888888888"
    And I enter required units "0"
    And I select future date for requirement
    And I enter address "Test Address"
    And I click the register patient button
    Then I should see an error about minimum units

  Scenario: Verify phone number format validation
    When I enter patient name "Phone Test"
    And I enter phone number "abcdefghij"
    Then the phone number field should not accept letters

  Scenario Outline: Register multiple patients successfully
    When I enter patient name "<name>"
    And I select blood group "<blood_group>"
    And I enter MRID "<mrid>"
    And I enter phone number "<phone>"
    And I enter required units "<units>"
    And I select future date for requirement
    And I enter address "<address>"
    And I click the register patient button
    Then I should see a success message

    Examples:
      | name          | blood_group | mrid     | phone      | units | address           |
      | Alice Brown   | A+          | MR10001  | 9111111111 | 1     | Address 1         |
      | Charlie Davis | B-          | MR10002  | 9222222222 | 2     | Address 2         |
      | Diana Evans   | O+          | MR10003  | 9333333333 | 3     | Address 3         |
      | Frank Green   | AB-         | MR10004  | 9444444444 | 4     | Address 4         |

  Scenario: Verify form clears after successful submission
    When I enter patient name "Clear Test"
    And I select blood group "A-"
    And I enter MRID "MR77777"
    And I enter phone number "9777777777"
    And I enter required units "1"
    And I select future date for requirement
    And I enter address "Test Clear Address"
    And I click the register patient button
    And I wait for success confirmation
    Then I should be redirected to patient management page

  Scenario: Verify MRID field accepts alphanumeric
    When I enter MRID "MR-2024-001"
    Then the MRID field should display "MR-2024-001"

  Scenario: Verify patient name field accepts full names
    When I enter patient name "Dr. Robert Smith Jr."
    Then the patient name field should display "Dr. Robert Smith Jr."

  Scenario: Verify address textarea accepts multiple lines
    When I enter address "Line 1\nLine 2\nLine 3"
    Then the address field should accept multiline input

  Scenario: Check responsive form layout
    Then the form should display properly on different screen sizes
    And the form fields should be organized in a grid layout

  Scenario: Verify page navigation elements
    Then I should see navigation back to home
    And the page should have proper branding

  Scenario: Test form with maximum valid units
    When I enter patient name "Max Units Test"
    And I select blood group "O-"
    And I enter MRID "MR88888"
    And I enter phone number "9888888888"
    And I enter required units "10"
    And I select future date for requirement
    And I enter address "Max Units Address"
    And I click the register patient button
    Then I should see a success message

  Scenario: Verify loading state during submission
    When I fill all patient details correctly
    And I click the register patient button
    Then the submit button should show loading state
    And the submit button should be disabled during submission

