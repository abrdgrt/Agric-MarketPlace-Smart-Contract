export function assert(statement, message) {
  if (!statement) {
    throw Error(message)
  }
}

export function ensure_all_arguments_gets_passed_in(expected_value, actual_value) {
  let expected_value_is_array_condition = Array.isArray(expected_value)
  let actual_value_is_array_condition = Array.isArray(actual_value)
  let same_length_condition = expected_value.length === actual_value.length
  let all_items_match = expected_value.every((val, index) => val === actual_value[index])
  assert(expected_value_is_array_condition && actual_value_is_array_condition && same_length_condition && all_items_match, `An invalid parameter or an invalid number of parameters was passed.`)
}