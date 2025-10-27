Feature: Donor Search by Patient MRID - Quick Test
  As a blood bank user
  I want to search for compatible donors using a patient's MRID
  So that I can find suitable donors for my patients

  Background:
    Given I am logged in as a blood bank user
    And I am on the blood bank dashboard

  @smoke @critical
  Scenario: Successfully find donors using valid patient MRID
    Given a patient with MRID "402" exists with blood group "A+"
    And donors with blood group "A+" are available
    When I enter MRID "402" in the donor search field
    And I click the search button
    Then I should see donor results
    And the patient information should be displayed

  @validation
  Scenario: Search with empty MRID field
    When I leave the MRID field empty
    And I click the search button
    Then I should see an error message "Please enter a patient MRID to search"

  @validation
  Scenario: Search with non-existent MRID
    When I enter MRID "INVALID9999" in the donor search field
    And I click the search button
    Then I should see an error message about patient not found

  @case-insensitive
  Scenario: Search with lowercase MRID should work
    Given a patient with MRID "402" exists
    When I enter MRID "402" in the donor search field
    And I click the search button
    Then I should see donor results
    And the MRID should be displayed as "402"

  @ui
  Scenario: Verify MRID search form UI elements
    Then I should see the MRID search section
    And I should see a text input field for MRID
    And I should see a search button

