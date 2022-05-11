const { faker } = require('@faker-js/faker');
const { join } = require('path');
const { writeFile } = require('fs/promises');

const Car = require('../src/entities/Car');
const CarCategory = require('../src/entities/CarCategory');
const Customer = require('../src/entities/Customer');

const seedersBaseFolder = join(__dirname, '../', 'database');

const ITEMS_AMOUNT = 2;

const carCategory = new CarCategory({
  id: faker.datatype.uuid(),
  name: faker.vehicle.type(),
  carIds: [],
  price: faker.finance.amount(20, 100),
});


const cars = [];
const customers = [];
for (let i = 0; i <= ITEMS_AMOUNT; i++) {
  const car = new Car({
    id: faker.datatype.uuid(),
    name: faker.vehicle.model(),
    available: true,
    gasAvailable: true,
    releaseYear: faker.date.past().getFullYear(),
  });
  
  const customer = new Customer({
    id: faker.datatype.uuid(),
    name: faker.name.findName(),
    age: faker.random.number({ min: 18, max: 50 }),
  });
  
  carCategory.carIds.push(car.id);
  cars.push(car);
  customers.push(customer);
}

const write = (fileName, data) => writeFile(join(seedersBaseFolder, fileName), JSON.stringify(data));

;(async () => { 
  await write('carCategory.json', [carCategory]);
  await write('customer.json', customers);
  await write('cars.json', cars);
  
})();