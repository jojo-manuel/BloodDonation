Feature: Donor Booking by Patient
  As a patient user
  I want to search for donors and book appointments
  So that I can find blood donors for my medical needs

  Background:
    Given I am logged in as a patient user with email "jeevan@gmail.com"
    And I am on the donor search page

  @smoke @booking
  Scenario: Search for donors by blood group
    When I select blood group "O+"
    And I enter location "Kochi"
    And I click the search button
    Then I should see a list of available donors
    And each donor should display their blood group
    And each donor should display their location

  @critical @booking
  Scenario: Book an appointment with a donor
    Given I have searched for donors with blood group "O+"
    And donors are available in the search results
    When I click "Request Blood" on the first donor
    And I fill in the booking form:
      | field              | value                    |
      | Hospital Name      | Medical College Hospital |
      | Required Date      | 2025-11-01              |
      | Units Required     | 2                        |
      | Urgency Level      | High                     |
      | Additional Notes   | Emergency requirement    |
    And I submit the booking request
    Then I should see a booking confirmation message
    And I should receive a booking reference number
    And the donor should be notified

  @booking
  Scenario: View my sent donation requests
    When I navigate to "My Requests" section
    Then I should see all my sent requests
    And each request should show:
      | information        |
      | Donor Name         |
      | Blood Group        |
      | Request Date       |
      | Status             |
      | Hospital Name      |

  @booking
  Scenario: Cancel a pending donation request
    Given I have a pending donation request
    When I navigate to "My Requests" section
    And I click "Cancel Request" on a pending request
    And I confirm the cancellation
    Then the request status should change to "Cancelled"
    And the donor should be notified of cancellation

  @booking @filter
  Scenario: Filter donors by multiple criteria
    When I apply the following filters:
      | filter         | value      |
      | Blood Group    | AB+        |
      | Location       | Ernakulam  |
      | Availability   | Available  |
      | Gender         | Any        |
    And I click the search button
    Then I should see only donors matching all criteria
    And the results should be sorted by proximity

  @booking @validation
  Scenario: Attempt to book with incomplete form
    Given I have searched for donors
    When I click "Request Blood" on a donor
    And I submit the booking form without filling required fields
    Then I should see validation errors
    And the form should highlight missing fields
    And the booking should not be submitted

  @booking
  Scenario: View donor profile before booking
    Given I have searched for donors
    When I click on a donor's profile
    Then I should see detailed donor information:
      | information           |
      | Full Name             |
      | Blood Group           |
      | Location              |
      | Total Donations       |
      | Last Donation Date    |
      | Availability Status   |
      | Contact Information   |

  @booking
  Scenario Outline: Search for multiple blood groups
    When I select blood group "<bloodGroup>"
    And I enter location "Kerala"
    And I click the search button
    Then I should see donors with blood group "<bloodGroup>"

    Examples:
      | bloodGroup |
      | A+         |
      | B+         |
      | O+         |
      | AB+        |
      | A-         |
      | O-         |

  @booking @emergency
  Scenario: Mark request as emergency
    Given I have searched for donors
    When I click "Request Blood" on a donor
    And I mark the request as "Emergency"
    And I fill in emergency details
    And I submit the booking request
    Then the request should be flagged as high priority
    And the donor should receive immediate notification
    And I should see "Emergency request sent" confirmation

