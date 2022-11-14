import {
  NearBindgen,
  near,
  call,
  view,
  LookupMap,
  UnorderedMap,
  NearPromise,
  UnorderedSet,
  initialize,
} from "near-sdk-js";
import { assert, ensure_all_arguments_gets_passed_in } from './utils';

interface order_struct {
  product_id: string;
  order_id: bigint;
  memo: string;
  amount: bigint;
  present_order_status_changed_timestamp: bigint;
  order_made_timestamp: bigint;
  order_owner: string;
  farmer_address: string;
  present_order_status: Status;
  order_started: boolean;
  product_price: bigint;
  delivery_confirmed: boolean;
  order_quantity: bigint;
  refund_requested: boolean;
  refund_approved: boolean;
  dispute_created: boolean;
  buyer_dispute_won: boolean;
  buyer_dispute_reason: string;
  to_pay: string;
}
interface farm_order {
  available: is_available;
  farmers_address: string;
  timestamp: bigint;
  product_cost: bigint;
  quantity_listed: bigint;
  last_edited_time_stamp: bigint;
  product_unit: string;
}

enum Status {
  ORDER_OPEN = "ORDER OPEN",
  ORDER_CONFIRMED = "ORDER CONFIRMED",
  DISPUTE_CREATED = "DISPUTE CREATED",
  BUYER_LOST_DISPUTE = "BUYER LOST DISPUTE",
  BUYER_WON_DISPUTE = "BUYER WON DISPUTE",
  DISPUTE_SETTLED = "DISPUTE SETTLED",
  RETURNING_GOODS_TO_FARMER = "RETURNING GOODS TO FARMER",
  GOODS_DELIVERED_TO_FARMER = "GOODS RETURNED TO FARMER",
  DELIVERING_GOODS = "DELIVERING GOODS",
  GOODS_DELIVERED = "GOODS DELIVERED",
  DISPUTED_ORDER_CLOSED = "DISPUTED ORDER CLOSED",
  ORDER_CLOSED = "ORDER CLOSED",
  ORDER_COMPLETED = "ORDER COMPLETED",
}

enum order_completed {
  NO = "NO",
  YES = "YES",
}

enum is_available {
  NO = "NO",
  YES = "YES",
}

const SECONDS_TO_NANO_SECONDS: bigint = 10n ** 9n;


// const DAY_TIMESTAMP: bigint = 0n;
// const WEEK_TIMESTAMP: bigint = 0n;


const DAY_TIMESTAMP: bigint = 86400n * SECONDS_TO_NANO_SECONDS as bigint;
const WEEK_TIMESTAMP: bigint = 604800n * SECONDS_TO_NANO_SECONDS;
const MINIMUM_PRODUCT_PRICE: bigint = 0n;
const eFama_funds_address: string = "efarma_marketplace.testnet";


//we want to send a minimum price that we can use to revert the transaction
//a function to check order status
@NearBindgen({ requireInit: true })
class eFamaMarketPlace {
  moderator_addresses: UnorderedSet<string>;
  escrow_balance: bigint;
  escrow_fee: bigint;
  total_items: bigint;
  total_confirmed: bigint;
  total_disputed: bigint;
  active_disputes: [bigint, bigint[]];
  orders: UnorderedMap<order_struct>;
  orders_by_product_id: LookupMap<Array<order_struct>>;
  orders_by_address: LookupMap<Array<order_struct>>;
  address_of_order_id: LookupMap<string>;
  is_completed: LookupMap<order_completed>;
  disputed_orders: LookupMap<boolean>;
  refunded_orders: LookupMap<boolean>;
  farmers_products: LookupMap<farm_order>;
  contract_deployed_timestamp: bigint;
  minimum_order_amount: bigint;

  constructor() {
    this.moderator_addresses = new UnorderedSet("moderator_address")
    this.escrow_balance = 0n;
    this.escrow_fee = 25n;
    this.total_items = 0n;
    this.total_confirmed = 0n;
    this.total_disputed = 0n;
    this.active_disputes = [0n, []];
    this.orders = new UnorderedMap("orders");
    this.orders_by_product_id = new LookupMap("orders_by_product_id");
    this.orders_by_address = new LookupMap("orders_by_address");
    this.address_of_order_id = new LookupMap("address_of_order_id");
    this.is_completed = new LookupMap("is_completed");
    this.farmers_products = new LookupMap("farm_products");
    this.contract_deployed_timestamp = near.blockTimestamp() as bigint;
    this.disputed_orders = new LookupMap("disputed_orders");
    this.refunded_orders = new LookupMap("refunded_orders");
    this.minimum_order_amount = MINIMUM_PRODUCT_PRICE;
  }

  @initialize({})
  //initialize the contract with the moderator address
  init({ moderator_address }: { moderator_address: string }): boolean {
    this.moderator_addresses.set(moderator_address);
    return this.moderator_addresses.contains(moderator_address);
  }

  @view({})
  //fetch the total balance present in the smart contract on this efama smart contract
  get_present_efama_balance(): string {
    return this.escrow_balance.toString();
  }

  @view({})
  //fetch the present commission being charged by efama on this efama smart contract
  get_efama_commision_fee(): string {
    return this.escrow_fee.toString();
  }

  @view({})
  //fetch the total number of completed orders on this efama smart contract
  get_efama_total_confirmed(): string {
    return this.total_confirmed.toString();
  }

  @view({})
  //fetch the total number of previously disputed orders on this efama smart contract
  get_efama_total_disputes(): string {
    return this.total_disputed.toString();
  }

  @view({})
  //fetch an array of all the orders made on this efama smart contract
  get_all_efama_orders({ }): object[] {
    if (this.orders.length < 1) [];
    let all_orders = this.orders;
    // let temp_array: UnorderedSet<order_struct> = new UnorderedSet('temp_array')
    let temp_array: order_struct[] = [];
    for (let [key, order] of all_orders) {
      temp_array.push(order);
    }
    return temp_array;
  }


  @view({})
  //fetch a product by it's product id. 
  view_farmers_listed_products({ product_id }: { product_id: string }): object {
    let function_arguments = Object.keys({ "product_id": 1 })
    let passed_in_arguments = Object.keys(arguments[0])
    ensure_all_arguments_gets_passed_in(function_arguments, passed_in_arguments)
    if (!this.farmers_products.containsKey(product_id)) return {};
    return this.farmers_products.get(product_id);
  }

  @view({})
  //** */
  //fetch an order by it's order id 
  get_order_status_by_order_id({ order_id }: { order_id: string }): object {
    let function_arguments = Object.keys({ "order_id": 1 })
    let passed_in_arguments = Object.keys(arguments[0])
    ensure_all_arguments_gets_passed_in(function_arguments, passed_in_arguments)
    let order_details: order_struct = this.orders.get(order_id);
    return order_details ? order_details : {};
  }

  @view({})
  //fetch all orders made by a single account using the account address.
  get_orders_by_an_address({
    owner_address,
  }: {
    owner_address: string;
  }): object[] {
    let order_found_for_this_address_condition = this.orders_by_address.containsKey(owner_address)
    let function_arguments = Object.keys({ "owner_address": 1 })
    let passed_in_arguments = Object.keys(arguments[0])
    ensure_all_arguments_gets_passed_in(function_arguments, passed_in_arguments)
    let unordered_orders_array = this.orders_by_address.get(owner_address);
    return order_found_for_this_address_condition ? unordered_orders_array : [];
  }


  @view({})
  //fetch the address of the person who created an order by it's order id
  get_owner_of_order_by_order_id({ order_id }: { order_id: string }): string {
    let address_has_created_an_order_condition = this.address_of_order_id.containsKey(order_id)
    let function_arguments = Object.keys({ "order_id": 1 })
    let passed_in_arguments = Object.keys(arguments[0])
    ensure_all_arguments_gets_passed_in(function_arguments, passed_in_arguments)
    return address_has_created_an_order_condition ? this.address_of_order_id.get(order_id) : '';
  }

  @view({})
  //fetch all orders made for a single product using it's product id
  get_all_orders_made_for_a_product({
    product_id,
  }: {
    product_id: string;
  }): object {
    let product_id_found_condition = this.address_of_order_id.containsKey(product_id)
    let function_arguments = Object.keys({ "product_id": 1 })
    let passed_in_arguments = Object.keys(arguments[0])
    ensure_all_arguments_gets_passed_in(function_arguments, passed_in_arguments)
    return product_id_found_condition ? this.orders_by_product_id.get(product_id) : {};
  }


  @view({})
  //fetch an array of the moderator addresses added to this efama smart contractf
  get_efama_moderator_addresses({ }): string[] {
    assert(!this.moderator_addresses.isEmpty(), 'There is nothing to display')
    let moderator_address_array = this.moderator_addresses.toArray();
    return moderator_address_array
  }



  @call({})
  //remove a previously added efama moderator address and return the status of the transaction as either true or false
  remove_efama_moderator_account({
    moderator_address,
  }: {
    moderator_address: string;
  }): boolean {
    let function_arguments = Object.keys({ "moderator_address": 1 })
    let passed_in_arguments = Object.keys(arguments[0])
    ensure_all_arguments_gets_passed_in(function_arguments, passed_in_arguments)
    assert(
      this.moderator_addresses.contains(near.predecessorAccountId()),
      "The address doesn't belong to a moderator'"
    );
    assert(this.moderator_addresses.length >= 1, 'There is only one address present, you might get locked out.')
    near.log(` eFama Moderator Account Removed - ${moderator_address}`);
    this.moderator_addresses.remove(moderator_address);
    return !this.moderator_addresses.contains(moderator_address);
  }

  @call({})
  // This method changes the state, for which it cost gas
  //add to the previously added moderator addresses on this efama smart contract
  add_another_efama_moderator_account({
    moderator_address,
  }: {
    moderator_address: string;
  }): boolean {
    let function_arguments = Object.keys({ "moderator_address": 1 })
    let passed_in_arguments = Object.keys(arguments[0])
    ensure_all_arguments_gets_passed_in(function_arguments, passed_in_arguments)
    assert(
      this.moderator_addresses.contains(near.predecessorAccountId()),
      "Only moderators are allowed to add other moderators :)"
    );
    near.log(`New eFama Moderator Account - ${moderator_address} Added.`);
    this.moderator_addresses.set(moderator_address);
    return this.moderator_addresses.contains(moderator_address);
  }

  @call({})
  //create a farm product listing. Change the state of the farmers_object attribute. The product must cost more than the minimum price set for every product. 
  create_a_farm_product_listing({
    product_id,
    product_cost,
    quantity_listed,
    product_unit,
    edit_status
  }: {
    product_id: string;
    product_cost: bigint;
    quantity_listed: bigint;
    product_unit: string;
    edit_status: string
  }): boolean {
    let function_arguments = Object.keys({ product_id: 1, product_cost: 1, quantity_listed: 1, product_unit: 1, edit_status: 1 })
    let passed_in_arguments = Object.keys(arguments[0])

    ensure_all_arguments_gets_passed_in(function_arguments, passed_in_arguments)
    let product_id_exists_condition = this.farmers_products.containsKey(product_id)

    let product_id_exists_and_product_creator_calls_method = product_id_exists_condition && (this.farmers_products.get(product_id)?.farmers_address === near.predecessorAccountId())
    let edit_condition = edit_status.toLowerCase().trim() === "true"
    let product_exists_and_edit_clause_triggered_by_owner_condition = product_id_exists_and_product_creator_calls_method && edit_condition


    let farm_data_obj: farm_order
    let correct_metric_unit_input_condition = (product_unit.toLowerCase() === "g" || product_unit.toLowerCase() === "ml") ? true : false;
    assert(
      product_cost > this.minimum_order_amount,
      "The product costs less than the minimum price for listable goods."
    );
    assert(!product_id_exists_condition || product_exists_and_edit_clause_triggered_by_owner_condition, 'There is already a product listed with this product id and you are not the owner.')
    assert(
      correct_metric_unit_input_condition,
      "You used the wrong unit for your product. Only grams (g) and millilitres (ml) are presently supported"
    );
    if (product_exists_and_edit_clause_triggered_by_owner_condition) {
      farm_data_obj = {
        ...this.farmers_products.get(product_id), last_edited_time_stamp: near.blockTimestamp(), quantity_listed, product_unit, product_cost, available: is_available.YES
      }
    }
    else {
      farm_data_obj = {
        available: is_available.YES,
        farmers_address: near.predecessorAccountId(),
        timestamp: near.blockTimestamp(),
        last_edited_time_stamp: near.blockTimestamp(),
        product_cost,
        quantity_listed,
        product_unit
      };
    }
    this.farmers_products.set(product_id, farm_data_obj);
    return this.farmers_products.containsKey(product_id);
  }


  @call({})
  //delete a farmer product listing. Must be called by the farmer that listed it
  delete_farmer_product_listing({
    product_id,
  }: {
    product_id: string;
  }): boolean {
    let function_arguments = Object.keys({ "product_id": 1 })
    let passed_in_arguments = Object.keys(arguments[0])
    // check that the product exists first
    let product_details = this.farmers_products.get(product_id);
    let product_orders = this.orders_by_product_id.get(product_id);
    let product_found_using_id_condition = this.orders_by_product_id.containsKey(product_id);
    ensure_all_arguments_gets_passed_in(function_arguments, passed_in_arguments)
    assert(
      this.farmers_products.containsKey(product_id),
      "The product with the specified product id was not found."
    );
    assert(
      product_details.farmers_address === near.predecessorAccountId(),
      "You are not the product owner. Kindly use a product id that you own"
    );
    //assert that the array is not empty
    if (product_found_using_id_condition && product_orders.length > 0) {
      for (let order of product_orders) {
        assert(
          order.present_order_status === Status.ORDER_CLOSED,
          "There is a pending order."
        );
      }
    }
    this.farmers_products.remove(product_id);
    near.log([
      `The product with product id of (${product_id}) was successfully deleted`,
    ]);
    return this.farmers_products.containsKey(product_id);
  }

  //place an order for a listed product id. 
  @call({ payableFunction: true })
  place_an_order_for_a_product_listing({
    product_id,
    memo,
    order_quantity,
    product_listed_unit,
  }: {
    product_id: string;
    memo: string;
    order_quantity: bigint;
    product_listed_unit: string;
  }): object {
    let function_arguments = Object.keys({ product_id: 1, memo: 1, order_quantity: 1, product_listed_unit: 1 })
    let passed_in_arguments = Object.keys(arguments[0])
    ensure_all_arguments_gets_passed_in(function_arguments, passed_in_arguments)
    let listed_product = this.farmers_products.get(product_id);
    let product_found = this.farmers_products.containsKey(product_id);

    //throw error if product was not found
    assert(product_found, "The product with the product id specified wasn't found.");
    assert(
      product_listed_unit.toLowerCase() ===
      listed_product.product_unit.toLowerCase(),
      `You used the wrong metric unit`
    );
    assert(
      listed_product.quantity_listed - order_quantity >= 0n,
      `There isn't enough produce to complete your order. There is just ${listed_product.quantity_listed} (${listed_product.product_unit}) units left`
    );



    assert(
      near.attachedDeposit() ===
      BigInt(listed_product.product_cost) * BigInt(order_quantity),
      `You sent ${near.attachedDeposit()} Near. Instead of ${listed_product.product_cost * order_quantity
      }`
    );

    assert(
      listed_product.available === is_available.YES,
      "Sorry, this product is no longer available."
    );


    let total_order_cost = BigInt(listed_product.product_cost) * BigInt(order_quantity);
    this.total_items += 1n;


    let order: order_struct = {
      product_id: product_id,
      order_id: this.total_items as bigint,
      memo: memo,
      farmer_address: listed_product.farmers_address,
      present_order_status: Status.ORDER_OPEN,
      present_order_status_changed_timestamp: near.blockTimestamp() as bigint,
      order_quantity: order_quantity as bigint,
      order_started: false,
      delivery_confirmed: false,
      product_price: listed_product.product_cost,
      amount: total_order_cost as bigint,
      order_made_timestamp: near.blockTimestamp() as bigint,
      refund_requested: false,
      refund_approved: false,
      dispute_created: false,
      buyer_dispute_won: false,
      buyer_dispute_reason: '',
      to_pay: listed_product.farmers_address,
      order_owner: near.predecessorAccountId(),
    };

    this.orders.set(order.order_id.toString(), order);

    let orders_by_product_id_unordered_set: Array<order_struct> =
      this.orders_by_product_id.containsKey(order.product_id)
        ? this.orders_by_product_id.get(order.product_id)
        : [];
    orders_by_product_id_unordered_set.push(order);

    this.orders_by_product_id.set(
      order.product_id,
      orders_by_product_id_unordered_set
    );


    let orders_by_address_unordered_set: Array<order_struct> =
      this.orders_by_address.containsKey(order.order_owner)
        ? this.orders_by_address.get(order.order_owner)
        : [];

    orders_by_address_unordered_set.push(order);

    this.orders_by_address.set(
      order.order_owner,
      orders_by_address_unordered_set
    );

    this.address_of_order_id.set(
      order.order_id.toString(),
      near.predecessorAccountId()
    );

    this.is_completed.set(order.order_id.toString(), order_completed.NO);

    this.escrow_balance += near.attachedDeposit();
    listed_product.quantity_listed = BigInt(listed_product.quantity_listed) - BigInt(order_quantity)

    if (BigInt(listed_product.quantity_listed) <= 0n) {
      listed_product.available = is_available.NO
      this.farmers_products.set(product_id, listed_product)
    }
    near.log([
      product_id,
      "NEW ORDER",
      Status.ORDER_OPEN,
      near.predecessorAccountId(),
    ]);
    return this.orders.get(order.order_id.toString());
  }

  @call({})
  accept_buyers_order({ order_id }: { order_id: string }): boolean {
    let function_arguments = Object.keys({ "order_id": 1 })
    let passed_in_arguments = Object.keys(arguments[0])
    let order_details = this.orders.get(order_id);
    let order_farmers_address = order_details.farmer_address;
    ensure_all_arguments_gets_passed_in(function_arguments, passed_in_arguments)
    assert(order_details != null, "Invalid order_id used.");

    assert(
      order_details.present_order_status === Status.ORDER_OPEN,
      "Order has already been accepted by the farmer"
    );
    assert(
      order_farmers_address === near.predecessorAccountId(),
      "Only the account that was used to list the product can accept it's product orders"
    );
    assert(
      this.is_completed.get(order_id) === order_completed.NO,
      "The order has been completed"
    );

    order_details.present_order_status = Status.ORDER_CONFIRMED;
    order_details.order_started = true
    order_details.present_order_status_changed_timestamp =
      near.blockTimestamp();

    let farmers_product = this.farmers_products.get(order_details.product_id)
    farmers_product.quantity_listed -= order_details.order_quantity;
    this.farmers_products.set(order_details.product_id, farmers_product)
    this.orders.set(order_id, order_details);
    return this.orders.get(order_id).order_started;
  }

  //how should the dispute be settled, once a refund is
  @call({})
  change_order_status_to_delivery_started({
    order_id,
  }: {
    order_id: string;
  }): boolean {
    let function_arguments = Object.keys({ "order_id": 1 })
    let passed_in_arguments = Object.keys(arguments[0])
    ensure_all_arguments_gets_passed_in(function_arguments, passed_in_arguments)
    let order_details = this.orders.get(order_id);
    let order_farmers_address = order_details.farmer_address;


    //only trigger when the order is still in the confirmation stage
    assert(
      order_details != null,
      "The order id wasn't found."
    );
    assert(
      order_farmers_address === near.predecessorAccountId(),
      "Only the product owner can make changes to this order."
    );
    assert(
      this.is_completed.get(order_id) === order_completed.NO,
      "The order has been completed."
    );

    assert(
      order_details.present_order_status === Status.ORDER_CONFIRMED,
      "The status of the delivery must be order confirmed to call this function. You might have already called this order or you must first confirm the order."
    );


    // only trigger when the product is in the proper status
    // only trigger when the order is still available
    //can only be triggered by the farmer

    order_details.present_order_status = Status.DELIVERING_GOODS;
    order_details.present_order_status_changed_timestamp =
      near.blockTimestamp();
    this.orders.set(order_id, order_details);
    near.log([
      order_id,
      "DELIVERY HAS BEEN INITIATED",
      Status.DELIVERING_GOODS,
      near.predecessorAccountId(),
    ]);
    return this.orders.get(order_id).present_order_status === Status.DELIVERING_GOODS;
  }

  @call({})
  confirm_order_has_been_delivered({
    order_id,
  }: {
    order_id: string;
  }): boolean {
    let function_arguments = Object.keys({ "order_id": 1 })
    let passed_in_arguments = Object.keys(arguments[0])
    ensure_all_arguments_gets_passed_in(function_arguments, passed_in_arguments)
    let order_details = this.orders.get(order_id);
    assert(
      order_details != null,
      "The order id wasn't found."
    );

    assert(
      order_details.farmer_address === near.predecessorAccountId(),
      "Only the product owner can make changes to this order."
    );
    assert(
      this.is_completed.get(order_id) === order_completed.NO,
      "The order has been completed."
    );

    assert(
      order_details.present_order_status === Status.DELIVERING_GOODS,
      "The order has already been marked as delivered or you've yet to indicate that the shipment has started."
    );


    order_details.delivery_confirmed = true;
    order_details.present_order_status = Status.GOODS_DELIVERED;
    order_details.present_order_status_changed_timestamp =
      near.blockTimestamp();
    this.orders.set(order_id, order_details);

    return this.orders.get(order_id).present_order_status === Status.GOODS_DELIVERED;
  }

  @call({})
  mark_order_as_completed({ order_id }: { order_id: string }): boolean {
    let function_arguments = Object.keys({ "order_id": 1 })
    let passed_in_arguments = Object.keys(arguments[0])
    ensure_all_arguments_gets_passed_in(function_arguments, passed_in_arguments)
    let order_details = this.orders.get(order_id);

    //only trigger when the order is still in the confirmation stage
    assert(
      order_details != null,
      "The order id wasn't found."
    );

    assert(
      order_details.order_owner === near.predecessorAccountId(),
      "Only the buyer can make indicate the order has been completed."
    );

    assert(
      this.is_completed.get(order_id) === order_completed.NO,
      "The order has been completed."
    );


    assert(
      order_details.present_order_status === Status.GOODS_DELIVERED ||
      order_details.present_order_status === Status.DISPUTE_CREATED,
      "Only orders that have been delivered or have just had a dispute created can be marked as completed"
    );


    this.is_completed.set(order_id, order_completed.YES)
    order_details.present_order_status = Status.ORDER_CLOSED;
    order_details.present_order_status_changed_timestamp =
      near.blockTimestamp();
    this.orders.set(order_id, order_details);
    near.log([
      order_id,
      "ORDER COMPLETED",
      Status.ORDER_CLOSED,
      near.predecessorAccountId(),
    ]);
    return this.is_completed.get(order_id) === order_completed.YES;
  }

  //the service hasn't been set as delivery_confirmed by the user and only the escrow is allowed to call the function
  @call({})
  request_an_order_refund({ order_id }: { order_id: string }): boolean {
    let function_arguments = Object.keys({ "order_id": 1 })
    let passed_in_arguments = Object.keys(arguments[0])
    ensure_all_arguments_gets_passed_in(function_arguments, passed_in_arguments)
    let order_details = this.orders.get(order_id);
    let order_was_made_less_than_12_hours_ago_condition = (order_details.order_made_timestamp + (DAY_TIMESTAMP / 2n)) >
      near.blockTimestamp()
    //only trigger when the order is still in the confirmation stage
    assert(
      order_details.present_order_status === Status.ORDER_OPEN,
      "The order status must be set as open for a refund to be issued."
    );

    assert(
      order_was_made_less_than_12_hours_ago_condition,
      "All orders older than 12 hours can't be refunded."
    );

    assert(
      order_details.order_owner === near.predecessorAccountId(),
      "Only the buyer can request for a refund for this order"
    );

    assert(
      this.is_completed.get(order_id) === order_completed.NO,
      "The order has been completed."
    );

    order_details.refund_requested = true;
    order_details.refund_approved = true;
    order_details.present_order_status_changed_timestamp = near.blockTimestamp();
    order_details.to_pay = order_details.order_owner
    order_details.present_order_status = Status.ORDER_CLOSED;
    this.orders.set(order_id, order_details);
    this.is_completed.set(order_id, order_completed.YES)
    near.log([
      order_id,
      "REFUND REQUESTED",
      Status.ORDER_CLOSED,
      near.predecessorAccountId(),
    ]);
    return this.orders.get(order_id).refund_approved;
  }

  @call({})
  create_dispute_for_a_delivered_order({
    order_id,
    dispute_reason
  }: {
    order_id: string;
    dispute_reason: string;
  }): boolean {
    let function_arguments = Object.keys({ "order_id": 1, "dispute_reason": "dispute reason" })
    let passed_in_arguments = Object.keys(arguments[0])
    ensure_all_arguments_gets_passed_in(function_arguments, passed_in_arguments)
    let order_details = this.orders.get(order_id);

    let order_is_delivered_condition =
      order_details.present_order_status === Status.GOODS_DELIVERED;
    let present_moment_timestamp = BigInt(near.blockTimestamp());

    let timestamp_24_hours_after_order_delivery =
      BigInt(order_details.present_order_status_changed_timestamp) + BigInt(DAY_TIMESTAMP);
    let order_delivered_less_than_24_hours_ago_condition =
      present_moment_timestamp <= timestamp_24_hours_after_order_delivery;


    assert(order_details !== null, `The order with the specified order id wasn't found.`)

    assert(
      this.is_completed.get(order_id) === order_completed.NO,
      "The order has been marked as completed"
    );

    assert(
      order_details.order_owner === near.predecessorAccountId(),
      "Only the owner of the order can create a dispute"
    );

    assert(
      order_is_delivered_condition &&
      order_delivered_less_than_24_hours_ago_condition,
      `Only orders that have been marked as delivered less than a day ago are eligble to create disputes`
    );


    order_details.present_order_status = Status.DISPUTE_CREATED;

    order_details.present_order_status_changed_timestamp =
      near.blockTimestamp();
    order_details.buyer_dispute_reason = dispute_reason;
    order_details.dispute_created = true;
    this.orders.set(order_id, order_details);
    this.total_disputed++;
    return this.orders.get(order_id).dispute_created;
  }

  @call({})

  update_client_dispute_request({
    order_id,
    status,
  }: {
    order_id: string;
    status: string;
  }): string {
    let function_arguments = Object.keys({ "order_id": 1, "status": 1 })
    let passed_in_arguments = Object.keys(arguments[0])
    ensure_all_arguments_gets_passed_in(function_arguments, passed_in_arguments)
    // we want to check that if we have changed the status to completed, then we only have about 2 days to re-edit it

    let order_details = this.orders.get(order_id);

    let less_than_a_day_after_order_status_updated_condition = (order_details.present_order_status_changed_timestamp + DAY_TIMESTAMP) > (near.blockTimestamp())
    let dispute_created_condition = order_details.present_order_status === Status.DISPUTE_CREATED

    let dispute_settlement_adjustment_condition = ((order_details.present_order_status === Status.BUYER_LOST_DISPUTE) || (order_details.present_order_status === Status.BUYER_WON_DISPUTE)) && less_than_a_day_after_order_status_updated_condition

    assert(
      this.moderator_addresses.contains(near.predecessorAccountId()),
      "Only moderators are allowed to update the status of a disputed order."
    );
    assert(
      this.is_completed.get(order_id) === order_completed.NO,
      "The order has been completed"
    );

    assert(
      dispute_created_condition || dispute_settlement_adjustment_condition,
      "There is either no dispute for this present order or you've exceeded the timeframe for changing your decision."
    );

    //we want to revert everything here,
    // we want to set the order status to closed and transfer the money back to the seller, charging them for gas
    if (status.toLowerCase().trim() === "accept") {
      order_details.buyer_dispute_won = true;
      order_details.present_order_status_changed_timestamp =
        near.blockTimestamp();
      order_details.present_order_status = Status.BUYER_WON_DISPUTE;
      order_details.to_pay = order_details.order_owner

    }
    else if (status.toLowerCase().trim() === "reject") {
      order_details.buyer_dispute_won = false;
      order_details.present_order_status_changed_timestamp =
        near.blockTimestamp();
      order_details.present_order_status = Status.BUYER_LOST_DISPUTE;
      order_details.to_pay = order_details.farmer_address
      near.log([
        `ORDER WITH ORDER_ID ${order_id} DISPUTE HAS BEEN SETTLED`,
        Status.BUYER_LOST_DISPUTE,
        near.predecessorAccountId(),
      ]);
      //we want to revert the state here
    }
    //if it is sucessful then transfer the funds and charge them for the gas
    this.orders.set(order_id, order_details);
    near.log([
      order_id,
      `${status.toUpperCase()}: BUYER ORDER DISPUTE SETTLED`,
      order_details.present_order_status,
      near.predecessorAccountId(),
    ]);
    return order_details.present_order_status;
  }

  @call({})
  //change the status of a disputed order to delivery started. Dispute must have been won to call this method.
  change_dispute_order_status_to_delivery_started({
    order_id,
  }: {
    order_id: string;
  }): boolean {
    let function_arguments = Object.keys({ "order_id": 1 })
    let passed_in_arguments = Object.keys(arguments[0])
    ensure_all_arguments_gets_passed_in(function_arguments, passed_in_arguments)

    let order_details = this.orders.get(order_id);

    let dispute_settled_condition =
      order_details.present_order_status === Status.BUYER_WON_DISPUTE;

    assert(order_details != null, "The order id specified wasn't found")
    assert(
      this.is_completed.get(order_id) === order_completed.NO,
      "The order has been completed."
    );
    assert(
      order_details.order_owner === near.predecessorAccountId(),
      "Only the owner of the order can indicate shipment has started to the farmer (seller)"
    );
    assert(
      dispute_settled_condition,
      "The order status can only be changed when the buyers dispute has been marked as won. Kindly ensure you haven't called this function before."
    );


    order_details.present_order_status = Status.RETURNING_GOODS_TO_FARMER;
    order_details.present_order_status_changed_timestamp =
      near.blockTimestamp();
    this.orders.set(order_id, order_details);
    near.log([
      order_id,
      "DELIVERY HAS BEEN INITIATED",
      Status.DELIVERING_GOODS,
      near.predecessorAccountId(),
    ]);
    return true;
  }

  //change the status of a disputed order to delivered, must order id must indicate that the shipment has started to call this method.
  @call({})
  change_dispute_order_status_to_delivered({
    order_id,
  }: {
    order_id: string;
  }): boolean {
    let function_arguments = Object.keys({ "order_id": 1 })
    let passed_in_arguments = Object.keys(arguments[0])

    let order_details = this.orders.get(order_id);
    let shipment_started_to_farmer_condition = order_details.present_order_status === Status.RETURNING_GOODS_TO_FARMER

    ensure_all_arguments_gets_passed_in(function_arguments, passed_in_arguments)
    assert(order_details != null, "The order id specified wasn't found")
    assert(
      shipment_started_to_farmer_condition,
      "The order has not yet been marked as being delivered to the farmer."
    );

    assert(
      order_details.order_owner === near.predecessorAccountId(),
      "Only the owner of the order can indicate that the order has been delivered to the selelr"
    );
    assert(
      this.is_completed.get(order_id) === order_completed.NO,
      "The order has already been marked as completed"
    );


    order_details.present_order_status = Status.GOODS_DELIVERED_TO_FARMER;
    order_details.present_order_status_changed_timestamp =
      near.blockTimestamp();
    this.orders.set(order_id, order_details);
    near.log([
      `The order with order_id ${order_id} of has been sent back to the farmer`,
      Status.GOODS_DELIVERED_TO_FARMER,
      near.predecessorAccountId(),
    ]);
    return this.orders.get(order_id).present_order_status === Status.GOODS_DELIVERED_TO_FARMER;;
  }

  //mark disputed order as completed
  @call({})
  mark_disputed_order_as_completed({
    order_id,
  }: {
    order_id: string;
  }): boolean {
    let function_arguments = Object.keys({ "order_id": 1 })
    let passed_in_arguments = Object.keys(arguments[0])
    let order_details = this.orders.get(order_id);

    ensure_all_arguments_gets_passed_in(function_arguments, passed_in_arguments)
    assert(order_details != null, "The order id specified wasn't found")
    assert(
      order_details.present_order_status === Status.GOODS_DELIVERED_TO_FARMER,
      "Order hasn't yet been marked as delivered by buyer"
    );

    assert(
      order_details.farmer_address === near.predecessorAccountId(),
      "Only the seller for this order can indicate they've received shipment from the buyer"
    );

    assert(
      this.is_completed.get(order_id) === order_completed.NO,
      "The order has been completed"
    );
    order_details.delivery_confirmed = true;
    order_details.present_order_status = Status.DISPUTED_ORDER_CLOSED;
    order_details.present_order_status_changed_timestamp =
      near.blockTimestamp();
    order_details.to_pay = order_details.order_owner
    this.orders.set(order_id, order_details);
    this.is_completed.set(order_id, order_completed.YES)

    near.log([
      order_id,
      "GOODS SUCCESSFULLY RETURNED TO THE FARMER",
      Status.DISPUTED_ORDER_CLOSED,
      near.predecessorAccountId(),
    ]);
    return this.orders.get(order_id).present_order_status === Status.DISPUTED_ORDER_CLOSED;
  }

  @call({})
  // withdraw payment for an order, depending on who's eligible
  withdraw_payment_for_order({ order_id }: { order_id: string }): NearPromise {
    let order_details: order_struct = this.orders.get(order_id);
    let function_arguments = Object.keys({ "order_id": 1 })
    let passed_in_arguments = Object.keys(arguments[0])
    let a_week_passed_since_order_status_was_updated = ((BigInt(order_details.present_order_status_changed_timestamp) + BigInt(WEEK_TIMESTAMP)) < BigInt(near.blockTimestamp()))
    let receiver_address: string = order_details.to_pay;
    let contract_deployed_day = new Date(Number(this.contract_deployed_timestamp) / 10 ** 6).getDay();
    let present_day = new Date(Number(near.blockTimestamp()) / 10 ** 6).getDay();
    let order_has_been_closed_condition = order_details.present_order_status === Status.ORDER_CLOSED
    let buyer_lost_dispute_condition = order_details.present_order_status === Status.BUYER_LOST_DISPUTE
    let a_week_after_seller_won_dispute_condition = buyer_lost_dispute_condition && a_week_passed_since_order_status_was_updated
    let withdrawal_address_eligible_condition = order_details.to_pay === near.predecessorAccountId()
    let withdrawal_day_condition = present_day === contract_deployed_day
    let refund_approved_for_order_condition = (order_details.refund_approved === true) && order_has_been_closed_condition
    let farmer_eligible_to_be_paid = (order_details.to_pay === order_details.farmer_address)
    let buyer_won_dispute_and_24_hours_has_passed = (order_details.present_order_status === Status.DISPUTED_ORDER_CLOSED) && ((order_details.present_order_status_changed_timestamp + DAY_TIMESTAMP) < near.blockTimestamp())
    let order_confirmed_atleast_a_week_ago_condition = order_has_been_closed_condition && a_week_passed_since_order_status_was_updated
    let farmer_order_confirmed_a_week_ago_and_eligble_for_withdrawal = order_confirmed_atleast_a_week_ago_condition && farmer_eligible_to_be_paid
    let refund_approved_or_farmer_order_closed_or_seller_won_dispute_or_buyer_won_dispute_condition = refund_approved_for_order_condition || farmer_order_confirmed_a_week_ago_and_eligble_for_withdrawal || a_week_after_seller_won_dispute_condition || buyer_won_dispute_and_24_hours_has_passed
    ensure_all_arguments_gets_passed_in(function_arguments, passed_in_arguments)
    assert(order_details != null, "The order id that was specified wasn't found")
    assert(
      withdrawal_address_eligible_condition,
      "You are not the one who's supposed to be paid for this order"
    );

    assert(withdrawal_day_condition, `Not yet pay day. Pay day is on day ${contract_deployed_day} - Today is day ${present_day}`);
    assert(refund_approved_or_farmer_order_closed_or_seller_won_dispute_or_buyer_won_dispute_condition, 'You are not eligible for a withdrawal yet.')
    let promise;
    let escrow_amount: bigint = ((this.escrow_fee * BigInt(order_details.amount)) / 100n)
    let buyer_amount = order_details.amount - escrow_amount
    let farmers_product = this.farmers_products.get(order_details.product_id)


    order_details.present_order_status = Status.ORDER_COMPLETED;
    order_details.present_order_status_changed_timestamp =
      near.blockTimestamp();
    this.is_completed.set(order_id, order_completed.YES)
    this.orders.set(order_id, order_details);
    this.escrow_balance -= buyer_amount;

    if (refund_approved_for_order_condition) {
      farmers_product.quantity_listed = BigInt(farmers_product.quantity_listed) + BigInt(order_details.order_quantity)
      promise = NearPromise.new(receiver_address).transfer(order_details.amount);
    }

    else if (a_week_after_seller_won_dispute_condition) {
      promise = NearPromise.new(receiver_address).transfer(buyer_amount).then(NearPromise.new(eFama_funds_address).transfer(escrow_amount));
    }

    else if (farmer_order_confirmed_a_week_ago_and_eligble_for_withdrawal) {
      promise = NearPromise.new(receiver_address).transfer(buyer_amount).then(NearPromise.new(eFama_funds_address).transfer(escrow_amount));
    }
    else if (buyer_won_dispute_and_24_hours_has_passed) {
      farmers_product.quantity_listed = BigInt(farmers_product.quantity_listed) + BigInt(order_details.order_quantity)
      promise = NearPromise.new(receiver_address).transfer(order_details.amount);
    }

    this.farmers_products.set(order_details.product_id, farmers_product)
    this.total_confirmed = BigInt(this.total_confirmed) + 1n
    near.log([
      order_id,
      "WITHDRAWAL MADE",
      Status.ORDER_COMPLETED,
      near.predecessorAccountId(),
    ]);
    this.escrow_balance = BigInt(this.escrow_balance) - BigInt(order_details.amount)
    return promise.onReturn();;
  }
}
