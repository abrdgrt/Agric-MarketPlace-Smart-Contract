#Set the order id variable
echo "Creating a new smart contract instance"
rm -rf ../contract/neardev 
export ORDERID="1"
export NEARID=$(npm run deploy | tail -1 | cut -d ' ' -f 4)
echo $NEARID

#INITIALISE THE CONTRACT WITH THE INFO NEEDED
npx near call $NEARID init '{"moderator_address":"efama_marketplace.testnet"}' --account-id $NEARID

#CREATE A FARM PRODUCT LISTING
npx near call $NEARID create_a_farm_product_listing '{"product_id": "1", "product_cost":"1000000000000000000000000", "quantity_listed": "5000000000", "product_unit":"g", "edit_status":"true"}' --account-id $NEARID

#PLACE AN ORDER FOR A PRODUCT LISTING
npx near call $NEARID place_an_order_for_a_product_listing '{"product_id": "1", "memo":"11", "order_quantity": "2", "product_listed_unit":"g"}' --account-id efama_marketplace.testnet --deposit 2
 
#FETCH A LIST OF ALL THE PRESENT ORDERS MADE
npx near view $NEARID get_all_efama_orders 

#request a refund
npx near call $NEARID request_an_order_refund '{"order_id": "'$ORDERID'"}' --account-id efama_marketplace.testnet

#withdraw the order
npx near call $NEARID  withdraw_payment_for_order '{"order_id": "'$ORDERID'"}' --account-id efama_marketplace.testnet