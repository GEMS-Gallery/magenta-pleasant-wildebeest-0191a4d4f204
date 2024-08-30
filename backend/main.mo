import Bool "mo:base/Bool";
import Text "mo:base/Text";

import Int "mo:base/Int";
import Nat "mo:base/Nat";
import Float "mo:base/Float";
import Array "mo:base/Array";
import Result "mo:base/Result";
import Random "mo:base/Random";
import Time "mo:base/Time";
import List "mo:base/List";

actor Roulette {
  // Stable variables
  stable var userBalance: Nat = 1000;
  stable var lastSpinResult: ?Nat = null;
  stable var spinHistory: List.List<Nat> = List.nil();

  // Mutable variable
  var bets: [(Text, Nat)] = [];

  // Helper function to generate random number
  private func generateRandomNumber() : async Nat {
    let seed = await Random.blob();
    let random = Random.Finite(seed);
    switch (random.range(37)) {
      case null { 0 };
      case (?value) { value };
    };
  };

  // Place a bet
  public shared func placeBet(betType: Text, amount: Nat) : async Result.Result<(), Text> {
    if (amount > userBalance) {
      return #err("Insufficient balance");
    };
    bets := Array.append(bets, [(betType, amount)]);
    userBalance -= amount;
    #ok();
  };

  // Spin the wheel
  public shared func spin() : async Result.Result<Nat, Text> {
    let winningNumber = await generateRandomNumber();
    lastSpinResult := ?winningNumber;
    spinHistory := List.push(winningNumber, spinHistory);
    if (List.size(spinHistory) > 10) {
      spinHistory := List.take(spinHistory, 10);
    };

    // Calculate winnings
    for ((betType, amount) in bets.vals()) {
      let winnings = calculateWinnings(betType, amount, winningNumber);
      userBalance += winnings;
    };

    // Clear bets
    bets := [];

    #ok(winningNumber);
  };

  // Calculate winnings based on bet type and winning number
  private func calculateWinnings(betType: Text, amount: Nat, winningNumber: Nat) : Nat {
    switch (betType) {
      case ("straight") {
        if (Nat.toText(winningNumber) == betType) {
          amount * 35
        } else {
          0
        };
      };
      case ("red") {
        if (isRed(winningNumber)) {
          amount * 2
        } else {
          0
        };
      };
      case ("black") {
        if (isBlack(winningNumber)) {
          amount * 2
        } else {
          0
        };
      };
      case ("even") {
        if (winningNumber % 2 == 0 and winningNumber != 0) {
          amount * 2
        } else {
          0
        };
      };
      case ("odd") {
        if (winningNumber % 2 == 1) {
          amount * 2
        } else {
          0
        };
      };
      case (_) { 0 };
    };
  };

  // Helper function to check if a number is red
  private func isRed(number: Nat) : Bool {
    let redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
    Array.find<Nat>(redNumbers, func (n) { n == number }) != null;
  };

  // Helper function to check if a number is black
  private func isBlack(number: Nat) : Bool {
    not isRed(number) and number != 0;
  };

  // Get user balance
  public query func getBalance() : async Nat {
    userBalance;
  };

  // Get last spin result
  public query func getLastSpinResult() : async ?Nat {
    lastSpinResult;
  };

  // Get spin history
  public query func getSpinHistory() : async [Nat] {
    List.toArray(spinHistory);
  };
};
