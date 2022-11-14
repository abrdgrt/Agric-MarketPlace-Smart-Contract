#Set the order id variable
echo "Creating a new smart contract instance"
rm -rf ../contract/neardev 
export ORDERID="1"
export NEARID=$(npm run deploy | tail -1 | cut -d ' ' -f 4)
echo "STARTING TEST NOW!"

#INITIALISE THE CONTRACT WITH THE INFO NEEDED
npx near call $NEARID init '{"moderator_address":"efama_marketplace.testnet"}' --account-id $NEARID

#CREATE A FARM PRODUCT LISTING
npx near call $NEARID create_a_farm_product_listing '{"product_id": "1", "product_cost":"1000000000000000000000000", "quantity_listed": "5000000000", "product_unit":"g", "edit_status":"true"}' --account-id $NEARID

#PLACE AN ORDER FOR A PRODUCT LISTING
npx near call $NEARID place_an_order_for_a_product_listing '{"product_id": "1", "memo":"11", "order_quantity": "2", "product_listed_unit":"g"}' --account-id efama_marketplace.testnet --deposit 2
 
 #Accept Buyers Order
npx near call $NEARID accept_buyers_order '{"order_id": "'$ORDERID'"}' --account-id $NEARID

 #CHANGE DELIVERY STATUS TO DELIVERY STARTED
npx near call $NEARID change_order_status_to_delivery_started '{"order_id": "'$ORDERID'"}' --account-id $NEARID 

#CONFIRM ORDER HAS BEEN HANDED OVER TO BUYER
npx near call $NEARID confirm_order_has_been_delivered '{"order_id": "'$ORDERID'"}' --account-id $NEARID

#CREATE A DISPUTE FOR A RECEIVED ORDER
npx near call $NEARID create_dispute_for_a_delivered_order '{"order_id": "'$ORDERID'", "dispute_reason": "No reason at all"}' --account-id efama_marketplace.testnet


npx near call $NEARID update_client_dispute_request '{"order_id": "'$ORDERID'", "status":"accept"}' --account-id efama_marketplace.testnet

npx near call $NEARID change_dispute_order_status_to_delivery_started '{"order_id": "'$ORDERID'"}' --account-id efama_marketplace.testnet

npx near call $NEARID change_dispute_order_status_to_delivered '{"order_id": "'$ORDERID'"}' --account-id efama_marketplace.testnet


npx near call $NEARID mark_disputed_order_as_completed '{"order_id": "'$ORDERID'"}' --account-id $NEARID

#withdraw funds
npx near call $NEARID withdraw_payment_for_order '{"order_id": "'$ORDERID'"}' --account-id efama_marketplace.testnet

