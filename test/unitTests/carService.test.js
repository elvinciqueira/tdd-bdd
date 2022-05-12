const { describe, it, before, beforeEach, afterEach } = require('mocha');
const { join } = require('path');
const { expect } = require('chai');
const sinon = require('sinon');

const CarService = require('./../../src/service/carService');
const Transaction = require('./../../src/entities/transaction');

const carsDatabase = join(__dirname, './../../database', 'cars.json');

const mocks = {
  validCarCategory: require('./../mocks/valid-carCategory.json'),
  validCar: require('./../mocks/valid-car.json'),
  validCustomer: require('./../mocks/valid-customer.json'),
};

describe('CarService Suite Tests', () => {
  let carService = {};
  let sandbox = {};

  before(() => {
    carService = new CarService({
      cars: carsDatabase,
    });
  });

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('given an array', () => {
    it('retrieve a random position', () => {
      const array = [0, 1, 2, 3, 4];
      const randomPosition = carService.getRandomPositionFromArray(array);

      expect(randomPosition).to.be.lte(array.length).and.be.gte(0);
    });
  });

  describe('given a car category', () => {
    it('choose the first car', () => {
      const carCategory = mocks.validCarCategory;
      const firstCar = 0;

      sandbox
        .stub(carService, carService.getRandomPositionFromArray.name)
        .returns(firstCar);

      const chosenRandomCar = carService.chooseRandomCar(carCategory);
      const expectedCar = carCategory.carIds[firstCar];

      expect(carService.getRandomPositionFromArray.calledOnce).to.be.ok;
      expect(chosenRandomCar).to.be.equal(expectedCar);
    });
  });

  describe("when check if there's a car available", () => {
    it('choose randomly a car from the category chosen', async () => {
      const car = mocks.validCar;
      const carCategory = Object.create(mocks.validCarCategory);
      carCategory.carIds = [car.id];

      sandbox
        .stub(carService.carRepository, carService.carRepository.find.name)
        .resolves(car);

      sandbox.spy(carService, carService.chooseRandomCar.name);

      const randomlyAvailableCar = await carService.getAvailableCar(
        carCategory
      );

      expect(carService.chooseRandomCar.calledOnce).to.be.ok;
      expect(carService.carRepository.find.calledWithExactly(car.id)).to.be.ok;
      expect(randomlyAvailableCar).to.be.deep.equal(car);
    });
  });

  describe('when rent a car for 5 days', () => {
    describe('and having 50 years old', () => {
      it('calculate final amount with 30% tax', async () => {
        const customer = Object.create(mocks.validCustomer);
        customer.age = 50;

        const carCategory = Object.create(mocks.validCarCategory);
        carCategory.price = 37.6;

        const numberOfDays = 5;

        // age: 50 - 1.3 tax - categoryPrice 37.6
        // 37.6 * 1.3 = 48,88 * 5 days = 244.40
        sandbox
          .stub(carService, 'taxesBasedOnAge')
          .get(() => [{ from: 40, to: 50, then: 1.3 }]);

        const formattedFinalAmount = carService.currencyFormat.format(244.4);
        const finalAmount = carService.calculateFinalPrice(
          customer,
          carCategory,
          numberOfDays
        );

        expect(finalAmount).to.be.deep.equal(formattedFinalAmount);
      });
    });
  });

  describe('when renting a car for 5 days', () => {
    it('return an transaction receipt', async () => {
      const car = mocks.validCar;
      const carCategory = {
        ...mocks.validCarCategory,
        price: 37.6,
        carIds: [car.id],
      };

      const customer = Object.create(mocks.validCustomer);
      customer.age = 20;

      const numberOfDays = 5;
      const dueDate = '10 de novembro de 2020';
      const currentDate = new Date(2020, 10, 5);

      sandbox.useFakeTimers(currentDate.getTime()); // set the current time to 2020-11-05
      sandbox
        .stub(carService.carRepository, carService.carRepository.find.name)
        .resolves(car);

      // age: 20, tax: 1.1, categoryPrice: 37.6
      // 37.6 * 1.1 = 41.36 * 5 days = 206.8
      const expectedAmount = carService.currencyFormat.format(206.8);
      const rentedCar = await carService.rent(
        customer,
        carCategory,
        numberOfDays
      );
      const receipt = new Transaction({
        customer,
        car,
        dueDate,
        amount: expectedAmount,
      });

      expect(rentedCar).to.be.deep.equal(receipt);
    });
  });
});
