// import { Worker, NearAccount } from 'near-workspaces';
// import anyTest, { TestFn } from 'ava';
// import { rootCertificates } from 'tls';

// const test = anyTest as TestFn<{
//   worker: Worker;
//   accounts: Record<string, NearAccount>;
// }>;

// test.beforeEach(async (t) => {
//   // Init the worker and start a Sandbox server
//   const worker = await Worker.init();

//   // Deploy contract
//   const root = worker.rootAccount;
//   const contract = await root.createSubAccount('test-account');

//   // Get wasm file path from package.json test script in folder above
//   await contract.deploy(process.argv[2]);

//   // Save state for test runs, it is unique for each test
//   t.context.worker = worker;
//   t.context.accounts = { root, contract };
//   await root.call(contract, "init", { moderator_address: "efama_marketplace.testnet" })

// });

// test.afterEach(async (t) => {
//   // Stop Sandbox server
//   await t.context.worker.tearDown().catch((error) => {
//     console.log('Failed to stop the Sandbox:', error);
//   });
// });


// test('Get present efama escrow balance', async (t) => {
//   const { contract } = t.context.accounts;
//   const contractBalance: string = await contract.view('get_present_efama_balance', {});
//   t.is(contractBalance, '0');
// });

// test('returns a list of the earned escrow current efarma balance', async (t) => {
//   const { contract } = t.context.accounts;
//   const total_fees_available_balance: string = await contract.view('get_present_efama_balance', {});
//   t.is(Number(total_fees_available_balance) === 0, true);
// });

// test('returns a list of the earned escrow fees that is remaining', async (t) => {
//   const { contract } = t.context.accounts;
//   const total_fees_available_balance: string = await contract.view('get_efama_accumulated_fees', {});
//   t.is(Number(total_fees_available_balance) === 0, true);
// });

// test('returns a list of the present escrow commission', async (t) => {
//   const { contract } = t.context.accounts;
//   const total_fees_available_balance: string = await contract.view('get_efama_commision_fee', {});
//   t.is(Number(total_fees_available_balance) === 25, true);
// });

// test('get the total number of confirmed transaction', async (t) => {
//   const { contract } = t.context.accounts;
//   const total_confirmed_transactions: string = await contract.view('get_efama_total_confirmed', {});
//   t.is(Number(total_confirmed_transactions) === 0, true);
// });

// test('get the total number of disputes created', async (t) => {
//   const { contract } = t.context.accounts;
//   const total_disputes_created: string = await contract.view('get_efama_total_disputes', {});
//   t.is(Number(total_disputes_created) === 0, true);
// });

// test('get all efama orders', async (t) => {
//   const { contract } = t.context.accounts;
//   const efama_ordes: string = await contract.view('get_all_efama_orders', {});
//   t.is(Number(efama_ordes) === 0, true);
// });


// test('get the moderator addresses for efarma', async (t) => {
//   const { contract } = t.context.accounts;
//   const efama_moderator_addresses: string = await contract.view('get_efama_moderator_addresses', {});
//   t.is(Number(efama_moderator_addresses) === 1, true);
// });

// test('add and remove and get moderator addresses for efarma', async (t) => {
//   const { contract } = t.context.accounts;
//   await contract.call(contract, 'add_another_efama_moderator_account', {});
//   const former_moderator_addresses_list: string = await contract.view('get_efama_moderator_addresses', {});
//   await contract.call(contract, 'remove_efama_moderator_account', { moderator_address: "second_added_moderator.testnet" });
//   const efama_moderator_addresses: string = await contract.view('get_efama_moderator_addresses', {});

//   t.is(Number(efama_moderator_addresses) === 0, true);
// });




// test('view farmers listed products', async (t) => {
//   const { contract } = t.context.accounts;
//   const total_confirmed_transactions: string = await contract.view('view_farmers_listed_products', { product_id: 1 });
//   t.is(Number(total_confirmed_transactions) === 0, true);
// });

// test('get order status by order id', async (t) => {
//   const { contract } = t.context.accounts;
//   const total_confirmed_transactions: string = await contract.view('get_efama_moderator_addresses', {});
//   t.is(Number(total_confirmed_transactions) === 0, true);
// });

// test('get orders by an address', async (t) => {
//   const { contract } = t.context.accounts;
//   const total_confirmed_transactions: string = await contract.view('get_efama_moderator_addresses', {});
//   t.is(Number(total_confirmed_transactions) === 0, true);
// });

// test('get address of order owner', async (t) => {
//   const { contract } = t.context.accounts;
//   const total_confirmed_transactions: string = await contract.view('get_efama_moderator_addresses', {});
//   t.is(Number(total_confirmed_transactions) === 0, true);
// });

// test('get all orders made on a single product', async (t) => {
//   const { contract } = t.context.accounts;
//   const total_confirmed_transactions: string = await contract.view('get_all_orders_made_for_a_product', { product_id: 1 });
//   t.is(Number(total_confirmed_transactions) === 0, true);
// });

// // test('get the total number of present disputes', async (t) => {
// //   const { contract } = t.context.accounts;
// //   const orders_list: string = await contract.view('get_efama_total_disputes', {});
// //   t.is(Array.isArray(orders_list), true);
// // });

// // test('get all efama orders', async (t) => {
// //   const { contract } = t.context.accounts;
// //   const orders_list: string = await contract.view('get_all_efama_orders', {});
// //   t.is(Array.isArray(orders_list), true);
// // });

// // test('get the present moderator account', async (t) => {
// //   const { contract } = t.context.accounts;
// //   const orders_list: string = await contract.view('get_efama_moderator_addresses', {});
// //   t.is(Array.isArray(orders_list), true);
// // });

// // test('can remove moderator address by provided address', async (t) => {
// //   const { root, contract } = t.context.accounts;
// //   const orders_list: string = await root.call(contract, 'remove_efama_moderator_account', { moderator_address: 'efama_marketplace.testnet' });
// //   t.is(Array.isArray(orders_list), true);
// // });

// // test('can add a moderator address by provided address', async (t) => {
// //   const { root, contract } = t.context.accounts;
// //   const orders_list: string = await root.call(contract, 'add_another_efama_moderator_account', { moderator_address: 'new_mod_account.testnet' });
// //   t.is(Array.isArray(orders_list), true);
// // });

