Feature: Donor Search by Patient MRID
  As a blood bank user
  I want to search for compatible donors using a patient's MRID
  So that I can find suitable donors for my patients' blood requirements

  Background:
    Given I am logged in as a blood bank user
    And I am on the blood bank dashboard
    And patients with MRIDs exist in the system

  @smoke @critical
  Scenario: Successfully find donors using valid patient MRID
    Given a patient with MRID "MR123456" exists with blood group "A+"
    And donors with blood group "A+" are available
    When I enter MRID "MR123456" in the donor search field
    And I click the search button
    Then I should see a success message
    And I should see a list of compatible donors
    And all displayed donors should have blood group "A+"
    And the patient information should be displayed
    And the patient blood group should show "A+"

  @validation
  Scenario: Search with empty MRID field
    When I leave the MRID field empty
    And I click the search button
    Then I should see an error message "Please enter a patient MRID to search"
    And no donor results should be displayed

  @validation
  Scenario: Search with non-existent MRID
    When I enter MRID "INVALID9999" in the donor search field
    And I click the search button
    Then I should see an error message about patient not found
    And no donor results should be displayed

  @validation
  Scenario: Search for patient with no matching donors
    Given a patient with MRID "MR999999" exists with blood group "AB-"
    But no donors with blood group "AB-" are available
    When I enter MRID "MR999999" in the donor search field
    And I click the search button
    Then I should see a message "No donors available for this blood group"
    And the patient information should still be displayed

  @bloodgroup-matching
  Scenario Outline: Search donors for different blood groups
    Given a patient with MRID "<mrid>" exists with blood group "<blood_group>"
    And donors with blood group "<blood_group>" are available
    When I enter MRID "<mrid>" in the donor search field
    And I click the search button
    Then I should see compatible donors with blood group "<blood_group>"

    Examples:
      | mrid      | blood_group |
      | MR001     | A+          |
      | MR002     | B+          |
      | MR003     | O+          |
      | MR004     | AB+         |
      | MR005     | A-          |
      | MR006     | O-          |

  @case-insensitive
  Scenario: Search with lowercase MRID should work
    Given a patient with MRID "MR789012" exists
    When I enter MRID "mr789012" in the donor search field
    And I click the search button
    Then I should see donor results
    And the MRID should be displayed as "MR789012"

  @partial-search
  Scenario: Search with partial MRID
    Given a patient with MRID "MR2024001" exists
    When I enter MRID "MR2024" in the donor search field
    And I click the search button
    Then I should see matching results

  @donor-information
  Scenario: Verify donor details in search results
    Given a patient with MRID "MR456789" exists with blood group "B+"
    And donor "John Doe" with blood group "B+" is available
    When I enter MRID "MR456789" in the donor search field
    And I click the search button
    Then I should see donor "John Doe" in the results
    And the donor card should display:
      | Name        |
      | Blood Group |
      | Phone       |
      | Email       |

  @request-creation
  Scenario: Create donation request from MRID search results
    Given a patient with MRID "MR111222" exists
    And I have searched for donors using MRID "MR111222"
    And donor results are displayed
    When I click "Send Request" on a donor card
    Then a donation request modal should open
    And the patient MRID should be pre-filled as "MR111222"
    And the blood group should be pre-filled

  @patient-info-display
  Scenario: Verify patient information display after search
    Given a patient with MRID "MR345678" exists with details:
      | Field           | Value              |
      | Name            | Priya Sharma       |
      | Blood Group     | O+                 |
      | Units Required  | 2                  |
      | Blood Bank      | City Blood Bank    |
    When I enter MRID "MR345678" in the donor search field
    And I click the search button
    Then I should see patient details:
      | Patient Name    | Priya Sharma    |
      | MRID            | MR345678        |
      | Blood Group     | O+              |
      | Units Needed    | 2               |

  @eligibility
  Scenario: Display donor eligibility status
    Given a patient with MRID "MR777888" exists with blood group "A+"
    And donor "Eligible Donor" with blood group "A+" last donated 4 months ago
    And donor "Recent Donor" with blood group "A+" last donated 2 months ago
    When I enter MRID "MR777888" in the donor search field
    And I click the search button
    Then "Eligible Donor" should show as eligible
    And "Recent Donor" should show as not yet eligible
    And the eligibility date should be displayed

  @blocked-donors
  Scenario: Blocked donors should not appear in search results
    Given a patient with MRID "MR888999" exists with blood group "B+"
    And donor "Active Donor" with blood group "B+" is active
    And donor "Blocked Donor" with blood group "B+" is blocked
    When I enter MRID "MR888999" in the donor search field
    And I click the search button
    Then I should see "Active Donor" in the results
    But I should not see "Blocked Donor" in the results

  @suspended-donors
  Scenario: Suspended donors should not appear in search results
    Given a patient with MRID "MR999000" exists with blood group "AB+"
    And donor "Active Donor" with blood group "AB+" is active
    And donor "Suspended Donor" with blood group "AB+" is suspended
    When I enter MRID "MR999000" in the donor search field
    And I click the search button
    Then I should see "Active Donor" in the results
    But I should not see "Suspended Donor" in the results

  @ui
  Scenario: Verify MRID search form UI elements
    Then I should see the MRID search section
    And I should see a text input field for MRID
    And I should see a search button
    And the MRID field should have placeholder text
    And the search button should be enabled when MRID is entered

  @loading
  Scenario: Display loading state during search
    Given a patient with MRID "MR111333" exists
    When I enter MRID "MR111333" in the donor search field
    And I click the search button
    Then a loading indicator should be displayed
    And the search button should be disabled during loading
    When the search completes
    Then the loading indicator should disappear
    And the results should be displayed

  @clear-results
  Scenario: Clear previous search results
    Given I have previously searched for MRID "MR222444"
    And donor results are displayed
    When I enter a new MRID "MR555666"
    And I click the search button
    Then the previous results should be cleared
    And new results for MRID "MR555666" should be displayed

  @sorting
  Scenario: Donors should be sorted by eligibility
    Given a patient with MRID "MR333555" exists with blood group "O+"
    And multiple donors with blood group "O+" are available
    When I enter MRID "MR333555" in the donor search field
    And I click the search button
    Then donors should be sorted with eligible donors first
    And donors who donated longer ago should appear first

  @empty-state
  Scenario: Display helpful message when no search performed
    Given I am on the donor search tab
    And I have not performed any search
    Then I should see a message prompting to enter MRID
    And I should see search instructions

  @success-indicators
  Scenario: Display success indicators after finding donors
    Given a patient with MRID "MR444666" exists
    When I enter MRID "MR444666" in the donor search field
    And I click the search button
    And donors are found
    Then I should see a success message with donor count
    And the message should indicate the blood group
    And the donor count should be accurate

  @error-recovery
  Scenario: Recover from search errors
    When I enter MRID "MR999999" in the donor search field
    And I click the search button
    And the search fails with an error
    Then I should see an error message
    When I enter a valid MRID "MR123456"
    And I click the search button
    Then the error should be cleared
    And new results should be displayed

  @accessibility
  Scenario: MRID search accessibility features
    Then the MRID input field should have a label
    And the search button should be keyboard accessible
    And search results should be screen reader friendly
    And error messages should be announced to screen readers

  @integration
  Scenario: Integration with donation request workflow
    Given a patient with MRID "MR777999" exists
    When I search for donors using MRID "MR777999"
    And I select a donor from the results
    And I send a donation request
    Then the request should contain the patient MRID
    And the request should contain the patient name
    And the request should contain the blood bank information

  @multiple-searches
  Scenario: Perform multiple consecutive searches
    When I search for MRID "MR111111" and get results
    Then I should see donors for MRID "MR111111"
    When I search for MRID "MR222222" and get results
    Then I should see donors for MRID "MR222222"
    And the results should be different from the previous search

  @special-characters
  Scenario: Handle MRID with special characters
    Given a patient with MRID "MR-2024-001" exists
    When I enter MRID "MR-2024-001" in the donor search field
    And I click the search button
    Then I should see donor results
    And the MRID should be displayed correctly

  @whitespace-handling
  Scenario: Handle whitespace in MRID input
    Given a patient with MRID "MR123456" exists
    When I enter MRID " MR123456 " with leading and trailing spaces
    And I click the search button
    Then the MRID should be trimmed automatically
    And I should see donor results for "MR123456"

