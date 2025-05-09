<!--
Oh Hi! I see you are editing the stdlib documentation, that's really cool.
I have a request for you – if you are going to update some stuff here please
check if the comments in the sources are up to date as well. You may find them
in the priv/stdlib directory. Thanks!
-->

# Standard library

Sophia language offers standard library that consists of several namespaces. Some of them are already
in the scope and do not need any actions to be used, while the others require some files to be included.

The out-of-the-box namespaces are:

- [Address](#address)
- [AENS](#aens)
- [AENSv2](#aensv2)
- [Auth](#auth)
- [Bits](#bits)
- [Bytes](#bytes)
- [Call](#call)
- [Chain](#chain)
- [Char](#char)
- [Contract](#contract)
- [Crypto](#crypto)
- [Int](#int)
- [Map](#map)
- [Oracle](#oracle)

The following ones need to be included as regular files with `.aes` suffix, for example
```
include "List.aes"
```

- [AENSCompat](#aenscompat)
- [Bitwise](#bitwise)
- [BLS12_381](#bls12_381)
- [Func](#func)
- [Frac](#frac)
- [List](#list)
- [Option](#option)
- [Pair](#pair)
- [Set](#set-stdlib)
- [String](#string)
- [Triple](#triple)

## Builtin namespaces

They are available without any explicit includes.

### Address

#### to_str
```
Address.to_str(a : address) : string
```

Base58 encoded string

#### to_bytes
```
Address.to_bytes(a : address) : bytes(32)
```

The binary representation of the address.

#### is_contract
```
Address.is_contract(a : address) : bool
```

Is the address a contract


#### is_oracle
```
Address.is_oracle(a : address) : bool
```

Is the address a registered oracle


#### is_payable
```
Address.is_payable(a : address) : bool
```

Can the address be spent to


#### to_contract
```
Address.to_contract(a : address) : C
```

Cast address to contract type C (where `C` is a contract)


### AENS

The old AENS namespace, kept in the compiler to be able to interact with
contracts from before Ceres, compiled using aesophia compiler version 7.x and
earlier. Used in [AENSCompat](#aenscompat) when converting between old and new
pointers.

#### Types

##### name
```
datatype name = Name(address, Chain.ttl, map(string, AENS.pointee))
```


##### pointee

```
datatype pointee = AccountPt(address) | OraclePt(address)
                 | ContractPt(address) | ChannelPt(address)
```

### AENSv2

Note: introduced in v8.0

The following functionality is available for interacting with the æternity
naming system (AENS).  If `owner` is equal to `Contract.address` the signature
`signature` is ignored, and can be left out since it is a named argument.
Otherwise we need a signature to prove that we are allowed to do AENS
operations on behalf of `owner`. The [signature is tied to a network
id](https://github.com/aeternity/protocol/blob/iris/consensus/consensus.md#transaction-signature),
i.e. the signature material should be prefixed by the network id.

#### Types

##### name
```
datatype name = Name(address, Chain.ttl, map(string, AENSv2.pointee))
```


##### pointee

```
datatype pointee = AccountPt(address) | OraclePt(address)
                 | ContractPt(address) | ChannelPt(address) | DataPt(bytes())
```

Note: on-chain there is a maximum length enforced for `DataPt`, it is 1024 bytes.
Sophia itself does _not_ check for this.

#### Functions

##### resolve
```
AENSv2.resolve(name : string, key : string) : option('a)
```

Name resolution. Here `name` should be a registered name and `key` one of the attributes
associated with this name (for instance `"account_pubkey"`). The return type
(`'a`) must be resolved at compile time to an atomic type and the value is
type checked against this type at run time.


##### lookup
```
AENSv2.lookup(name : string) : option(AENSv2.name)
```

If `name` is an active name `AENSv2.lookup` returns a name object.
The three arguments to `Name` are `owner`, `expiry` and a map of the
`pointees` for the name. Note: the expiry of the name is always a fixed TTL.
For example:
```
let Some(AENSv2.Name(owner, FixedTTL(expiry), ptrs)) = AENSv2.lookup("example.chain")
```

Note: Changed to produce `AENSv2.name` in v8.0 (Ceres protocol upgrade).

##### preclaim
```
AENSv2.preclaim(owner : address, commitment_hash : hash, <signature : signature>) : unit
```

The [signature](./sophia_features.md#delegation-signature) should be a
serialized structure containing `network id`, `owner address`, and
`Contract.address`.

From Ceres (i.e. FATE VM version 3) the
[signature](./sophia_features.md#delegation-signature) can also be generic
(allowing _all_, existing and future, names to be delegated with one
signature), i.e. containing `network id`, `owner address`, `Contract.address`.


##### claim
```
AENSv2.claim(owner : address, name : string, salt : int, name_fee : int, <signature : signature>) : unit
```

The [signature](./sophia_features.md#delegation-signature) should be a
serialized structure containing `network id`, `owner address`, and
`Contract.address`. Using the private key of `owner address` for signing.

From Ceres (i.e. FATE VM version 3) the
[signature](./sophia_features.md#delegation-signature) can also be generic
(allowing _all_, existing and future, names to be delegated with one
signature), i.e. containing `network id`, `owner address`, `name_hash`, and
`Contract.address`.


##### transfer
```
AENSv2.transfer(owner : address, new_owner : address, name : string, <signature : signature>) : unit
```

Transfers name to the new owner.

The [signature](./sophia_features.md#delegation-signature) should be a
serialized structure containing `network id`, `owner address`, and
`Contract.address`. Using the private key of `owner address` for signing.

From Ceres (i.e. FATE VM version 3) the
[signature](./sophia_features.md#delegation-signature) can also be generic
(allowing _all_, existing and future, names to be delegated with one
signature), i.e. containing `network id`, `owner address`, `name_hash`, and
`Contract.address`.


##### revoke
```
AENSv2.revoke(owner : address, name : string, <signature : signature>) : unit
```

Revokes the name to extend the ownership time.

The [signature](./sophia_features.md#delegation-signature) should be a
serialized structure containing `network id`, `owner address`, and
`Contract.address`. Using the private key of `owner address` for signing.

From Ceres (i.e. FATE VM version 3) the
[signature](./sophia_features.md#delegation-signature) can also be generic
(allowing _all_, existing and future, names to be delegated with one
signature), i.e. containing `network id`, `owner address`, `name_hash`, and
`Contract.address`.


##### update
```
AENSv2.update(owner : address, name : string, expiry : option(Chain.ttl), client_ttl : option(int),
              new_ptrs : option(map(string, AENSv2.pointee)), <signature : signature>) : unit
```

Updates the name. If the optional parameters are set to `None` that parameter
will not be updated, for example if `None` is passed as `expiry` the expiry
block of the name is not changed.

Note: Changed to consume `AENSv2.pointee` in v8.0 (Ceres protocol upgrade).

The [signature](./sophia_features.md#delegation-signature) should be a
serialized structure containing `network id`, `owner address`, and
`Contract.address`. Using the private key of `owner address` for signing.

From Ceres (i.e. FATE VM version 3) the
[signature](./sophia_features.md#delegation-signature) can also be generic
(allowing _all_, existing and future, names to be delegated with one
signature), i.e. containing `network id`, `owner address`, `name_hash`, and
`Contract.address`.

### Auth


#### tx

```
Auth.tx : option(Chain.tx)
```

Where `Chain.tx` is (built-in) defined like:
```
namespace Chain =
  record tx = { paying_for : option(Chain.paying_for_tx)
              , ga_metas : list(Chain.ga_meta_tx)
              , actor : address
              , fee   : int
              , ttl   : int
              , tx    : Chain.base_tx }

  datatype ga_meta_tx    = GAMetaTx(address, int)
  datatype paying_for_tx = PayingForTx(address, int)
  datatype base_tx = SpendTx(address, int, string)
                   | OracleRegisterTx | OracleQueryTx | OracleResponseTx | OracleExtendTx
                   | NamePreclaimTx | NameClaimTx(hash) | NameUpdateTx(string)
                   | NameRevokeTx(hash) | NameTransferTx(address, string)
                   | ChannelCreateTx(address) | ChannelDepositTx(address, int) | ChannelWithdrawTx(address, int) |
                   | ChannelForceProgressTx(address) | ChannelCloseMutualTx(address) | ChannelCloseSoloTx(address)
                   | ChannelSlashTx(address) | ChannelSettleTx(address) | ChannelSnapshotSoloTx(address)
                   | ContractCreateTx(int) | ContractCallTx(address, int)
                   | GAAttachTx
```


#### tx_hash
```
Auth.tx_hash : option(hash)
```

Gets the transaction hash during authentication. Note: `Auth.tx_hash`
computation differs between protocol versions (changed in Ceres!), see
[aeserialisation](https://github.com/aeternity/protocol/blob/master/serializations.md)
specification for details.


### Bits

#### none
```
Bits.none : bits
```

A bit field with all bits cleared


#### all
```
Bits.all : bits
```

A bit field with all bits set


#### set
```
Bits.set(b : bits, i : int) : bits
```

Set bit i


#### clear
```
Bits.clear(b : bits, i : int) : bits
```

Clear bit i


#### test
```
Bits.test(b : bits, i : int) : bool
```

Check if bit i is set


#### sum
```
Bits.sum(b : bits) : int
```

Count the number of set bits


#### union
```
Bits.union(a : bits, b : bits) : bits
```

Bitwise disjunction


#### intersection
```
Bits.intersection(a : bits, b : bits) : bits
```

Bitwise conjunction


#### difference
```
Bits.difference(a : bits, b : bits) : bits
```

Each bit is true if and only if it was 1 in `a` and 0 in `b`


### Bytes

#### to\_int
```
Bytes.to_int(b : bytes(n)) : int
```

Interprets the byte array as a big endian integer


#### to\_str
```
Bytes.to_str(b : bytes(n)) : string
```

Returns the hexadecimal representation of the byte array


#### concat
```
Bytes.concat : (a : bytes(m), b : bytes(n)) => bytes(m + n)
```

Concatenates two byte arrays. If `m` and `n` are known at compile time, the
result can be used as a fixed size byte array, otherwise it has type `bytes()`.


#### split
```
Bytes.split(a : bytes(m + n)) : bytes(m) * bytes(n)
```

Splits a byte array at given index

#### split\_any
```
Bytes.split_any(a : bytes(), at : int) : option(bytes() * bytes(n))
```

Splits an arbitrary size byte array at index `at`. If `at` is positive split
from the beginning of the array, if `at` is negative, split `abs(at)` from the
_end_ of the array. If the array is shorter than `abs(at)` then `None` is
returned.

#### to\_fixed\_size
```
Bytes.to_fixed_size(a : bytes()) : option(bytes(n))
```

Converts an arbitrary size byte array to a fix size byte array. If `a` is
not `n` bytes, `None` is returned.

#### to\_any\_size
```
Bytes.to_any_size(a : bytes(n)) : bytes()
```

Converts a fixed size byte array to an arbitrary size byte array. This is a
no-op at run-time, and only used during type checking.

#### size
```
Bytes.size(a : bytes()) : int
```

Computes the lenght/size of a byte array.

### Call

Values related to the call to the current contract

#### origin
```
Call.origin : address
```

The address of the account that signed the call transaction that led to this call.


#### caller
```
Call.caller : address
```

The address of the entity (possibly another contract) calling the contract.

#### value
```
Call.value : int
```

The amount of coins transferred to the contract in the call.


#### gas_price
```
Call.gas_price : int
```

The gas price of the current call.

#### fee
```
Call.fee : int
```

The fee of the current call.


#### gas_left
```
Call.gas_left : int
```

The amount of gas left for the current call.


### Chain

Values and functions related to the chain itself and other entities that live on it.

#### Types

##### ttl

Time-to-live (fixed height or relative to current block).

Note that this type is a special case, where the type `ttl` is inside the
`Chain` scope, but the constrctors `FixedTTL(int)` and `RelativeTTL(int)` are
not. Meaning that the type `ttl` should be qualified with `Chain` when it is
used (i.e. `Chain.ttl`), but the constructors should not be qualified (i.e.
`FixedTTL(1050)` should be used rather than `Chain.FixedTTL(1050)`).

```
Chain.ttl = FixedTTL(int) | RelativeTTL(int)
```

##### tx
```
record tx = { paying_for : option(Chain.paying_for_tx)
            , ga_metas : list(Chain.ga_meta_tx)
            , actor : address
            , fee   : int
            , ttl   : int
            , tx    : Chain.base_tx }
```

##### ga_meta_tx
```
datatype ga_meta_tx    = GAMetaTx(address, int)
```

##### paying_for_tx
```
datatype paying_for_tx = PayingForTx(address, int)
```


##### base_tx
```
datatype base_tx = SpendTx(address, int, string)
                 | OracleRegisterTx | OracleQueryTx | OracleResponseTx | OracleExtendTx
                 | NamePreclaimTx | NameClaimTx(hash) | NameUpdateTx(string)
                 | NameRevokeTx(hash) | NameTransferTx(address, string)
                 | ChannelCreateTx(address) | ChannelDepositTx(address, int) | ChannelWithdrawTx(address, int) |
                 | ChannelForceProgressTx(address) | ChannelCloseMutualTx(address) | ChannelCloseSoloTx(address)
                 | ChannelSlashTx(address) | ChannelSettleTx(address) | ChannelSnapshotSoloTx(address)
                 | ContractCreateTx(int) | ContractCallTx(address, int)
                 | GAAttachTx
```


#### Functions

##### balance
```
Chain.balance(a : address) : int
```

The balance of account `a`.


##### block_hash
```
Chain.block_hash(h : int) : option(bytes(32))
```

The hash of the block at height `h`. `h` has to be within 256 blocks from the
current height of the chain or else the function will return `None`.

NOTE: In FATE VM version 1 `Chain.block_height` was not considered an
allowed height. From FATE VM version 2 (IRIS) it will return the block hash of
the current generation.


##### block_height
```
Chain.block_height : int
```

The height of the current block (i.e. the block in which the current call will be included).

##### bytecode_hash
```
Chain.bytecode_hash : 'c => option(hash)
```

Returns the hash of the contract's bytecode (or `None` if it is
nonexistent or deployed before FATE2). The type `'c` must be
instantiated with a contract. The charged gas increases linearly to
the size of the serialized bytecode of the deployed contract.


##### create
```
Chain.create(value : int, ...) => 'c
```

Creates and deploys a new instance of a contract `'c`. All of the
unnamed arguments will be passed to the `init` function. The charged
gas increases linearly with the size of the compiled child contract's
bytecode. The `source_hash` on-chain entry of the newly created
contract will be the SHA256 hash over concatenation of

- whole contract source code
- single null byte
- name of the child contract

The resulting contract's public key can be predicted and in case it happens to
have some funds before its creation, its balance will be increased by
the `value` parameter.

The `value` argument (default `0`) is equivalent to the value in the contract
creation transaction – it sets the initial value of the newly created contract
charging the calling contract. Note that this won't be visible in `Call.value`
in the `init` call of the new contract. It will be included in
`Contract.balance`, however.

The type `'c` must be instantiated with a contract.


Example usage:
```
payable contract Auction =
  record state = {supply: int, name: string}
  entrypoint init(supply, name) = {supply: supply, name: name}
  stateful payable entrypoint buy(amount) =
    require(Call.value == amount, "amount_value_mismatch")
    ...
  stateful entrypoint sell(amount) =
    require(amount >= 0, "negative_amount")
    ...

main contract Market =
  type state = list(Auction)
  entrypoint init() = []
  stateful entrypoint new(name : string) =
    let new_auction = Chain.create(0, name) : Auction
    put(new_auction::state)
```

The typechecker must be certain about the created contract's type, so it is
worth writing it explicitly as shown in the example.


##### clone
```
Chain.clone : ( ref : 'c, gas : int, value : int, protected : bool, ...
              ) => if(protected) option('c) else 'c
```

Clones the contract under the mandatory named argument `ref`. That means a new
contract of the same bytecode and the same `payable` parameter shall be created.
**NOTE:** the `state` won't be copied and the contract will be initialized with
a regular call to the `init` function with the remaining unnamed arguments. The
resulting contract's public key can be predicted and in case it happens to have
some funds before its creation, its balance will be increased by the `value`
parameter. This operation is significantly cheaper than `Chain.create` as it
costs a fixed amount of gas.


The `gas` argument (default `Call.gas_left`) limits the gas supply for the
`init` call of the cloned contract.

The `value` argument (default `0`) is equivalent to the value in the contract
creation transaction – it sets the initial value of the newly created contract
charging the calling contract. Note that this won't be visible in `Call.value`
in the `init` call of the new contract. It will be included in
`Contract.balance`, however.

The `protected` argument (default `false`) works identically as in remote calls.
If set to `true` it will change the return type to `option('c)` and will catch
all errors such as `abort`, out of gas and wrong arguments. Note that it can
only take a boolean *literal*, so other expressions such as variables will be
rejected by the compiler.

The type `'c` must be instantiated with a contract.

Example usage:

```
payable contract interface Auction =
  entrypoint init : (int, string) => void
  stateful payable entrypoint buy : (int) => unit
  stateful entrypoint sell : (int) => unit

main contract Market =
  type state = list(Auction)
  entrypoint init() = []
  stateful entrypoint new_of(template : Auction, name : string) =
    switch(Chain.clone(ref=template, protected=true, 0, name))
      None => abort("Bad auction!")
      Some(new_auction) =>
        put(new_auction::state)
```

When cloning by an interface, `init` entrypoint declaration is required. It is a
good practice to set its return type to `void` in order to indicate that this
function is not supposed to be called and is state agnostic. Trivia: internal
implementation of the `init` function does not actually return `state`, but
calls `put` instead. Moreover, FATE prevents even handcrafted calls to `init`.


##### coinbase
```
Chain.coinbase : address
```

The address of the account that mined the current block.


##### difficulty
```
Chain.difficulty : int
```

The difficulty of the current block.


##### event
```
Chain.event(e : event) : unit
```

Emits the event. To use this function one needs to define the `event` type as a
`datatype` in the contract.


##### gas\_limit
```
Chain.gas_limit : int
```

The gas limit of the current block.


##### network_id
```
Chain.network_id : string
```

The network id of the chain.


##### spend
```
Chain.spend(to : address, amount : int) : unit
```

Spend `amount` tokens to `to`. Will fail (and abort the contract) if contract
doesn't have `amount` tokens to transfer, or, if `to` is not `payable`.


##### timestamp
```
Chain.timestamp : int
```

The timestamp of the current block (unix time, milliseconds).


### Char

#### to_int
```
Char.to_int(c : char) : int
```

Returns the UTF-8 codepoint of a character


#### from_int

```
Char.from_int(i : int) : option(char)
```

Opposite of [to_int](#to_int). Returns `None` if the integer doesn't correspond to a single (normalized) codepoint.


### Contract

Values related to the current contract

#### creator
```
Contract.creator : address
```

Address of the entity that signed the contract creation transaction


#### address
```
Contract.address : address
```

Address of the contract account


#### balance
```
Contract.balance : int
```

Amount of coins in the contract account


### Crypto

#### sha3
```
Crypto.sha3(x : 'a) : hash
```

Hash any object to SHA3


#### sha256
```
Crypto.sha256(x : 'a) : hash
```

Hash any object to SHA256


#### blake2b
```
Crypto.blake2b(x : 'a) : hash
```

Hash any object to blake2b


#### poseidon
```
Crypto.poseidon(x1 : int, x2 : int) : int
```

Hash two integers (in the scalar field of BLS12-381) to another integer (in the scalar
field of BLS12-281). This is a ZK/SNARK-friendly hash function.


#### verify_sig
```
Crypto.verify_sig(msg : bytes(), pubkey : address, sig : signature) : bool
```

Checks if the signature of `msg` was made using private key corresponding to
the `pubkey`.

Note: before v8 of the compiler, `msg` had type `hash` (i.e. `bytes(32)`).


#### ecverify_secp256k1
```
Crypto.ecverify_secp256k1(msg : hash, addr : bytes(20), sig : bytes(65)) : bool
```

Verifies a signature for a msg against an Ethereum style address. Note that the
signature should be 65 bytes and include the recovery identifier byte `V`. The
expected organization of the signature is (`V || R || S`).


#### ecrecover_secp256k1
```
Crypto.ecrecover_secp256k1(msg : hash, sig : bytes(65)) : option(bytes(20))
```

Recovers the Ethereum style address from a msg hash and respective
ECDSA-signature. Note that the signature should be 65 bytes and include the
recovery identifier byte `V`. The expected organization of the signature is (`V
|| R || S`).


#### verify_sig_secp256k1
```
Crypto.verify_sig_secp256k1(msg : hash, pubkey : bytes(64), sig : bytes(64)) : bool
```

Verifies a standard 64-byte ECDSA signature (`R || S`).


### Int

#### mulmod
```
Int.mulmod : (a : int, b : int, q : int) : int
```

Combined multiplication and modulus, returns `(a * b) mod q`.

#### to\_str
```
Int.to_str(n : int) : string
```

Casts the integer to a string (in decimal representation).

#### to\_bytes
```
Int.to_bytes(n : int, size : int) : bytes()
```

Casts the integer to a byte array with `size` bytes (big endian, truncating if
necessary not preserving signedness). I.e. if you try to squeeze `-129` into a
single byte that will be indistinguishable from `127`.


### Map

#### lookup
`Map.lookup(k : 'k, m : map('k, 'v)) : option('v)`

Returns the value under a key in given map as `Some` or `None`
if the key is not present


#### lookup_default
`Map.lookup_default(k : 'k, m : map('k, 'v), v : 'v) : 'v`

Returns the value under a key in given map or the
default value `v` if the key is not present


#### member
`Map.member(k : 'k, m : map('k, 'v)) : bool`

Checks if the key is present in the map


#### delete
`Map.delete(k : 'k, m : map('k, 'v)) : map('k, 'v)`

Removes the key from the map


#### size
`Map.size(m : map('k, 'v)) : int`

Returns the number of elements in the map


#### to_list
`Map.to_list(m : map('k, 'v)) : list('k * 'v)`

Returns a list containing pairs of keys and their respective elements.


#### from_list
`Map.from_list(m : list('k * 'v)) : map('k, 'v)`

Turns a list of pairs of form `(key, value)` into a map


### Oracle

#### register
```
Oracle.register(<signature : bytes(64)>, acct : address, qfee : int, ttl : Chain.ttl) : oracle('a, 'b)
```

Registers new oracle answering questions of type `'a` with answers of type `'b`.

* The `acct` is the address of the oracle to register (can be the same as the contract).
* The [signature](./sophia_features.md#delegation-signature) should be a
  serialized structure containing `network id`, `account address`, and
  `contract address`. Using the private key of `account address` for signing.
  Proving you have the private key of the oracle to be. If the address is the same
  as the contract `sign` is ignored and can be left out entirely.
* The `qfee` is the minimum query fee to be paid by a user when asking a question of the oracle.
* The `ttl` is the Time To Live for the oracle in key blocks, either relative to the current
  key block height (`RelativeTTL(delta)`) or a fixed key block height (`FixedTTL(height)`).
* The type `'a` is the type of the question to ask.
* The type `'b` is the type of the oracle answers.

Examples:
```
  Oracle.register(addr0, 25, RelativeTTL(400))
  Oracle.register(addr1, 25, RelativeTTL(500), signature = sign1)
```


#### get\_question
```
Oracle.get_question(o : oracle('a, 'b), q : oracle_query('a, 'b)) : 'a
```

Checks what was the question of query `q` on oracle `o`


#### respond
```
Oracle.respond(<signature : bytes(64)>, o : oracle('a, 'b), q : oracle_query('a, 'b), 'b) : unit
```

Responds to the question `q` on `o`.  Unless the contract address is the same
as the oracle address the `signature` (which is an optional, named argument)
needs to be provided. Proving that we have the private key of the oracle by
[signing](./sophia_features.md#delegation-signature) should be a serialized
structure containing `network id`, `oracle query id`, and `contract address`.


#### extend
```
Oracle.extend(<signature : bytes(64)>, o : oracle('a, 'b), ttl : Chain.ttl) : unit
```

Extends TTL of an oracle.
* `singature` is a named argument and thus optional. Must be the same as for `Oracle.register`
* `o` is the oracle being extended
* `ttl` must be `RelativeTTL`. The time to live of `o` will be extended by this value.

#### query\_fee
```
Oracle.query_fee(o : oracle('a, 'b)) : int
```

Returns the query fee of the oracle


#### query
```
Oracle.query(o : oracle('a, 'b), q : 'a, qfee : int, qttl : Chain.ttl, rttl : Chain.ttl) : oracle_query('a, 'b)
```

Asks the oracle a question.
* The `qfee` is the query fee debited to the contract account (`Contract.address`).
* The `qttl` controls the last height at which the oracle can submit a response
  and can be either fixed or relative.
* The `rttl` must be relative and controls how long an answer is kept on the chain.
The call fails if the oracle could expire before an answer.


#### get\_answer
```
Oracle.get_answer(o : oracle('a, 'b), q : oracle_query('a, 'b)) : option('b)
```

Checks what is the optional query answer


#### expiry

```
Oracle.expiry(o : oracle('a, 'b)) : int
```

Ask the oracle when it expires. The result is the block height at which it will happen.


#### check
```
Oracle.check(o : oracle('a, 'b)) : bool
```

Returns `true` iff the oracle `o` exists and has correct type


#### check_query
```
Oracle.check_query(o : oracle('a, 'b), q : oracle_query('a, 'b)) : bool
```

It returns `true` iff the oracle query exist and has the expected type.


## Includable namespaces

These need to be explicitly included (with `.aes` suffix)


### AENSCompat

Note: to use `AENSCompat` functions you need to `include "AENSCompat.aes"`

#### pointee\_to\_V2
```
AENSCompat.pointee_to_V2(p : AENS.pointee) : AENSv2.pointee
```

Translate old pointee format to new, this is always possible.

#### pointee\_from\_V2
```
AENSCompat.pointee_from_V2(p2 : AENSv2.pointee) : option(AENS.pointee)
```

Translate new pointee format to old, `DataPt` can't be translated, so `None` is returned in this case.


### BLS12\_381

Note: to use `BLS12\_381` functions you need to `include "BLS12\_381.aes"`

#### Types

##### fr

Built-in (Montgomery) integer representation 32 bytes


##### fp

Built-in (Montgomery) integer representation 48 bytes


##### fp2
```
record fp2 = { x1 : fp, x2 : fp }`
```


##### g1
```
record g1  = { x : fp, y : fp, z : fp }
```


##### g2
```
record g2  = { x : fp2, y : fp2, z : fp2 }
```


##### gt
```
record gt  = { x1 : fp, x2 : fp, x3 : fp, x4 : fp, x5 : fp, x6 : fp, x7 : fp, x8 : fp, x9 : fp, x10 : fp, x11 : fp, x12 : fp }
```

#### Functions

##### pairing\_check
```
BLS12_381.pairing_check(xs : list(g1), ys : list(g2)) : bool
```

Pairing check of a list of points, `xs` and `ys` should be of equal length.

##### int_to_fr
```
BLS12_381.int_to_fr(x : int) : fr
```

Convert an integer to an `fr` - a 32 bytes internal (Montgomery) integer representation.

##### int_to_fp
```
BLS12_381.int_to_fp(x : int) : fp
```

Convert an integer to an `fp` - a 48 bytes internal (Montgomery) integer representation.

##### fr_to_int
```
BLS12_381.fr_to_int(x : fr)  : int
```

Convert a `fr` value into an integer.

##### fp_to_int
```
BLS12_381.fp_to_int(x : fp)  : int
```

Convert a `fp` value into an integer.

##### mk_g1
```
BLS12_381.mk_g1(x : int, y : int, z : int) : g1
```

Construct a `g1` point from three integers.

##### mk_g2
```
BLS12_381.mk_g2(x1 : int, x2 : int, y1 : int, y2 : int, z1 : int, z2 : int) : g2
```

Construct a `g2` point from six integers.

##### g1_neg
```
BLS12_381.g1_neg(p : g1) : g1
```

Negate a `g1` value.

##### g1_norm
```
BLS12_381.g1_norm(p : g1) : g1
```

Normalize a `g1` value.

##### g1_valid
```
BLS12_381.g1_valid(p : g1) : bool
```

Check that a `g1` value is a group member.

##### g1_is_zero
```
BLS12_381.g1_is_zero(p : g1) : bool
```

Check if a `g1` value corresponds to the zero value of the group.

##### g1_add
```
BLS12_381.g1_add(p : g1, q : g1) : g1
```

Add two `g1` values.

##### g1_mul
```
BLS12_381.g1_mul(k : fr, p : g1) : g1
```

Scalar multiplication for `g1`.

##### g2_neg
```
BLS12_381.g2_neg(p : g2) : g2
```

Negate a `g2` value.

##### g2_norm
```
BLS12_381.g2_norm(p : g2) : g2
```

Normalize a `g2` value.

##### g2_valid
```
BLS12_381.g2_valid(p : g2) : bool
```

Check that a `g2` value is a group member.

##### g2_is_zero
```
BLS12_381.g2_is_zero(p : g2) : bool
```

Check if a `g2` value corresponds to the zero value of the group.

##### g2_add
```
BLS12_381.g2_add(p : g2, q : g2) : g2
```

Add two `g2` values.

##### g2_mul
```
BLS12_381.g2_mul(k : fr, p : g2) : g2
```

Scalar multiplication for `g2`.

##### gt_inv
```
BLS12_381.gt_inv(p : gt) : gt
```

Invert a `gt` value.

##### gt_add
```
BLS12_381.gt_add(p : gt, q : gt) : gt
```

Add two `gt` values.

##### gt_mul
```
BLS12_381.gt_mul(p : gt, q : gt) : gt
```

Multiply two `gt` values.

##### gt_pow
```
BLS12_381.gt_pow(p : gt, k : fr) : gt
```

Calculate exponentiation `p ^ k`.

##### gt_is_one
```
BLS12_381.gt_is_one(p : gt) : bool
```

Compare a `gt` value to the unit value of the Gt group.

##### pairing
```
BLS12_381.pairing(p : g1, q : g2) : gt
```

Compute the pairing of a `g1` value and a `g2` value.

##### miller_loop
```
BLS12_381.miller_loop(p : g1, q : g2) : gt
```

Do the Miller loop stage of pairing for `g1` and `g2`.

##### final_exp
```
BLS12_381.final_exp(p : gt) : gt
```

Perform the final exponentiation step of pairing for a `gt` value.


### Func

Functional combinators.

Note: to use `Func` functions you need to `include "Func.aes"`

#### id
```
Func.id(x : 'a) : 'a
```

Identity function. Returns its argument.


#### const
```
Func.const(x : 'a) : 'b => 'a = (y) => x
```

Constant function constructor. Given `x` returns a function that returns `x` regardless of its argument.


#### flip
```
Func.flip(f : ('a, 'b) => 'c) : ('b, 'a) => 'c
```

Switches order of arguments of arity 2 function.


#### comp
```
Func.comp(f : 'b => 'c, g : 'a => 'b) : 'a => 'c
```

Function composition. `comp(f, g)(x) == f(g(x))`.


#### pipe
```
Func.pipe(f : 'a => 'b, g : 'b => 'c) : 'a => 'c
```

Flipped function composition. `pipe(f, g)(x) == g(f(x))`.


#### rapply
```
Func.rapply(x : 'a, f : 'a => 'b) : 'b
```

Reverse application. `rapply(x, f) == f(x)`.


#### recur
```
Func.recur(f : ('arg => 'res, 'arg) => 'res) : 'arg => 'res
```

The Z combinator. Allows performing local recursion and having anonymous recursive lambdas. To make function `A => B` recursive the user needs to transform it to take two arguments instead – one of type `A => B` which is going to work as a self-reference, and the other one of type `A`  which is the original argument. Therefore, transformed function should have `(A => B, A) => B` signature.

Example usage:
```
let factorial = recur((fac, n) => if(n < 2) 1 else n * fac(n - 1))
```

If the function is going to take more than one argument it will need to be either tuplified or have curried out latter arguments.

Example (factorial with custom step):

```
// tuplified version
let factorial_t(n, step) =
  let fac(rec, args) =
    let (n, step) = args
    if(n < 2) 1 else n * rec((n - step, step))
  recur(fac)((n, step))

// curried version
let factorial_c(n, step) =
  let fac(rec, n) = (step) =>
    if(n < 2) 1 else n * rec(n - 1)(step)
  recur(fac)(n)(step)
```


#### iter
```
Func.iter(n : int, f : 'a => 'a) : 'a => 'a
```

`n`th composition of f with itself, for instance `iter(3, f)` is equivalent to `(x) => f(f(f(x)))`.


#### curry
```
Func.curry2(f : ('a, 'b) => 'c) : 'a => ('b => 'c)
Func.curry3(f : ('a, 'b, 'c) => 'd) : 'a => ('b => ('c => 'd))
```

Turns a function that takes n arguments into a curried function that takes
one argument and returns a function that waits for the rest in the same
manner. For instance `curry2((a, b) => a + b)(1)(2) == 3`.


#### uncurry
```
Func.uncurry2(f : 'a => ('b => 'c)) : ('a, 'b) => 'c
Func.uncurry3(f : 'a => ('b => ('c => 'd))) : ('a, 'b, 'c) => 'd
```

Opposite to [curry](#curry).


#### tuplify
```
Func.tuplify2(f : ('a, 'b) => 'c) : (('a * 'b)) => 'c
Func.tuplify3(f : ('a, 'b, 'c) => 'd) : 'a * 'b * 'c => 'd
```

Turns a function that takes n arguments into a function that takes an n-tuple.


#### untuplify
```
Func.untuplify2(f : 'a * 'b => 'c) : ('a, 'b) => 'c
Func.untuplify3(f : 'a * 'b * 'c => 'd) : ('a, 'b, 'c) => 'd
```

Opposite to [tuplify](#tuplify).


### Frac

This namespace provides operations on rational numbers. A rational number is represented
as a fraction of two integers which are stored internally in the `frac` datatype.

The datatype consists of three constructors `Neg/2`, `Zero/0` and `Pos/2` which determine the
sign of the number. Both values stored in `Neg` and `Pos` need to be strictly positive
integers. However, when creating a `frac` you should never use the constructors explicitly.
Instead of that, always use provided functions like `make_frac` or `from_int`. This helps
keeping the internal representation well defined.

The described below functions take care of the normalization of the fractions –
they won't grow if it is unnecessary. Please note that the size of `frac` can be still
very big while the value is actually very close to a natural number – the division of
two extremely big prime numbers *will* be as big as both of them. To face this issue
the [optimize](#optimize) function is provided. It will approximate the value of the
fraction to fit in the given error margin and to shrink its size as much as possible.

**Important note:** `frac` must *not* be compared using standard `<`-like operators.
The operator comparison is not possible to overload at this moment, nor the
language provides checkers to prevent unintended usage of them. Therefore the typechecker
**will** allow that and the results of such comparison will be unspecified.
You should use [lt](#lt), [geq](#geq), [eq](#eq) etc instead.

Note: to use `Frac` functions you need to `include "Frac.aes"`

#### Types

##### frac
```
datatype frac = Pos(int, int) | Zero | Neg(int, int)
```

Internal representation of fractional numbers. First integer encodes the numerator and the second the denominator –
both must be always positive, as the sign is being handled by the choice of the constructor.


#### Functions

##### make_frac
`Frac.make_frac(n : int, d : int) : frac`

Creates a fraction out of numerator and denominator. Automatically normalizes, so
`make_frac(2, 4)` and `make_frac(1, 2)` will yield same results.


##### num
`Frac.num(f : frac) : int`

Returns the numerator of a fraction.


##### den
`Frac.den(f : frac) : int`

Returns the denominator of a fraction.


##### to_pair
`Frac.to_pair(f : frac) : int * int`

Turns a fraction into a pair of numerator and denominator.


##### sign
`Frac.sign(f : frac) : int`

Returns the signum of a fraction, -1, 0, 1 if negative, zero, positive respectively.


##### to_str
`Frac.to_str(f : frac) : string`

Conversion to string. Does not display division by 1 or denominator if equals zero.


##### simplify
`Frac.simplify(f : frac) : frac`

Reduces fraction to normal form if for some reason it is not in it.


##### eq
`Frac.eq(a : frac, b : frac) : bool`

Checks if `a` is equal to `b`.


##### neq
`Frac.neq(a : frac, b : frac) : bool`

Checks if `a` is not equal to `b`.


##### geq
`Frac.geq(a : frac, b : frac) : bool`

Checks if `a` is greater or equal to `b`.


##### leq
`Frac.leq(a : frac, b : frac) : bool`

Checks if `a` is lesser or equal to `b`.


##### gt
`Frac.gt(a : frac, b : frac) : bool`

Checks if `a` is greater than `b`.


##### lt
`Frac.lt(a : frac, b : frac) : bool`

Checks if `a` is lesser than `b`.


##### min
`Frac.min(a : frac, b : frac) : frac`

Chooses lesser of the two fractions.


##### max
`Frac.max(a : frac, b : frac) : frac`

Chooses greater of the two fractions.


##### abs
`Frac.abs(f : frac) : frac`

Absolute value.


##### from_int
`Frac.from_int(n : int) : frac`

From integer conversion. Effectively `make_frac(n, 1)`.


##### floor
`Frac.floor(f : frac) : int`

Rounds a fraction to the nearest lesser or equal integer.


##### ceil
`Frac.ceil(f : frac) : int`

Rounds a fraction to the nearest greater or equal integer.


##### round_to_zero
`Frac.round_to_zero(f : frac) : int`

Rounds a fraction towards zero.
Effectively `ceil` if lesser than zero and `floor` if greater.


##### round_from_zero
`Frac.round_from_zero(f : frac) : int`

Rounds a fraction from zero.
Effectively `ceil` if greater than zero and `floor` if lesser.


##### round
`Frac.round(f : frac) : int`

Rounds a fraction to a nearest integer. If two integers are in the same distance it
will choose the even one.


##### add
`Frac.add(a : frac, b : frac) : frac`

Sum of the fractions.


##### neg
`Frac.neg(a : frac) : frac`

Negation of the fraction.


##### sub
`Frac.sub(a : frac, b : frac) : frac`

Subtraction of two fractions.


##### inv
`Frac.inv(a : frac) : frac`

Inverts a fraction. Throws error if `a` is zero.


##### mul
`Frac.mul(a : frac, b : frac) : frac`

Multiplication of two fractions.


##### div
`Frac.div(a : frac, b : frac) : frac`

Division of two fractions.


##### int_exp
`Frac.int_exp(b : frac, e : int) : frac`

Takes `b` to the power of `e`. The exponent can be a negative value.


##### optimize
`Frac.optimize(f : frac, loss : frac) : frac`

Shrink the internal size of a fraction as much as possible by approximating it to the
point where the error would exceed the `loss` value.


##### is_sane
`Frac.is_sane(f : frac) : bool`

For debugging. If it ever returns false in a code that doesn't call `frac` constructors or
accept arbitrary `frac`s from the surface you should report it as a
[bug](https://github.com/aeternity/aesophia/issues/new)

If you expect getting calls with malformed `frac`s in your contract, you should use
this function to verify the input.


### List

This module contains common operations on lists like constructing, querying, traversing etc.

Note: to use `List` functions you need to `include "List.aes"`

#### is_empty
```
List.is_empty(l : list('a)) : bool
```

Returns `true` iff the list is equal to `[]`.


#### first
```
List.first(l : list('a)) : option('a)
```

Returns `Some` of the first element of a list or `None` if the list is empty.


#### tail
```
List.tail(l : list('a)) : option(list('a))
```

Returns `Some` of a list without its first element or `None` if the list is empty.


#### last
```
List.last(l : list('a)) : option('a)
```

Returns `Some` of the last element of a list or `None` if the list is empty.


#### contains
```
List.contains(e : 'a, l : list('a)) : bool
```
Checks if list `l` contains element `e`. Equivalent to `List.find(x => x == e, l) != None`.


#### find
```
List.find(p : 'a => bool, l : list('a)) : option('a)
```

Finds first element of `l` fulfilling predicate `p` as `Some` or `None` if no such element exists.


#### find_indices
```
List.find_indices(p : 'a => bool, l : list('a)) : list(int)
```

Returns list of all indices of elements from `l` that fulfill the predicate `p`.


#### nth
```
List.nth(n : int, l : list('a)) : option('a)
```

Gets `n`th element of `l` as `Some` or `None` if `l` is shorter than `n + 1` or `n` is negative.


#### get
```
List.get(n : int, l : list('a)) : 'a
```

Gets `n`th element of `l` forcefully, throwing and error if `l` is shorter than `n + 1` or `n` is negative.


#### length
```
List.length(l : list('a)) : int
```

Returns length of a list.


#### from_to
```
List.from_to(a : int, b : int) : list(int)
```

Creates an ascending sequence of all integer numbers between `a` and `b` (including `a` and `b`).


#### from_to_step
```
List.from_to_step(a : int, b : int, step : int) : list(int)
```

Creates an ascending sequence of integer numbers betweeen `a` and `b` jumping by given `step`. Includes `a` and takes `b` only if `(b - a) mod step == 0`. `step` should be bigger than 0.


#### replace_at
```
List.replace_at(n : int, e : 'a, l : list('a)) : list('a)
```

Replaces `n`th element of `l` with `e`. Throws an error if `n` is negative or would cause an overflow.


#### insert_at
```
List.insert_at(n : int, e : 'a, l : list('a)) : list('a)
```

Inserts `e` into `l` to be on position `n` by shifting following elements further. For instance,
```
insert_at(2, 9, [1,2,3,4])
```
will yield `[1,2,9,3,4]`.


#### insert_by
```
List.insert_by(cmp : (('a, 'a) => bool), x : 'a, l : list('a)) : list('a)
```

Assuming that cmp represents `<` comparison, inserts `x` before the first element in the list `l` which is greater than it. For instance,
```
insert_by((a, b) => a < b, 4, [1,2,3,5,6,7])
```
will yield `[1,2,3,4,5,6,7]`


#### foldr
```
List.foldr(cons : ('a, 'b) => 'b, nil : 'b, l : list('a)) : 'b
```

Right fold of a list. Assuming `l = [x, y, z]` will return `f(x, f(y, f(z, nil)))`.
Not tail recursive.


#### foldl
```
List.foldl(rcons : ('b, 'a) => 'b, acc : 'b, l : list('a)) : 'b
```

Left fold of a list. Assuming `l = [x, y, z]` will return `f(f(f(acc, x), y), z)`.
Tail recursive.

#### foreach
```
List.foreach(l : list('a), f : 'a => unit) : unit
```

Evaluates `f` on each element of a list.


#### reverse
```
List.reverse(l : list('a)) : list('a)
```

Returns a copy of `l` with reversed order of elements.


#### map
```
List.map(f : 'a => 'b, l : list('a)) : list('b)
```

Maps function `f` over a list. For instance
```
map((x) => x == 0, [1, 2, 0, 3, 0])
```
will yield `[false, false, true, false, true]`


#### flat_map
```
List.flat_map(f : 'a => list('b), l : list('a)) : list('b)
```

Maps `f` over a list and then flattens it. For instance
```
flat_map((x) => [x, x * 10], [1, 2, 3])
```
will yield `[1, 10, 2, 20, 3, 30]`


#### filter
```
List.filter(p : 'a => bool, l : list('a)) : list('a)
```

Filters out elements of `l` that fulfill predicate `p`. For instance
```
filter((x) => x > 0, [-1, 1, -2, 0, 1, 2, -3])
```
will yield `[1, 1, 2]`


#### take
```
List.take(n : int, l : list('a)) : list('a)
```

Takes `n` first elements of `l`. Fails if `n` is negative. If `n` is greater than length of a list it will return whole list.


#### drop
```
List.drop(n : int, l : list('a)) : list('a)
```

Removes `n` first elements of `l`. Fails if `n` is negative. If `n` is greater than length of a list it will return `[]`.


#### take_while
```
List.take_while(p : 'a => bool, l : list('a)) : list('a)
```

Returns longest prefix of `l` in which all elements fulfill `p`.


#### drop_while
```
List.drop_while(p : 'a => bool, l : list('a)) : list('a)
```

Removes longest prefix from `l` in which all elements fulfill `p`.


#### partition
```
List.partition(p : 'a => bool, l : list('a)) : (list('a) * list('a))
```

Separates elements of `l` that fulfill `p` and these that do not. Elements fulfilling the predicate will be in the first element of the returned tuple. For instance
```
partition((x) => x > 0, [-1, 1, -2, 0, 1, 2, -3])
```
will yield `([1, 1, 2], [-1, -2, 0, -3])`


#### flatten
```
List.flatten(ll : list(list('a))) : list('a)
```

Flattens a list of lists into a one list.


#### all
```
List.all(p : 'a => bool, l : list('a)) : bool
```

Checks if all elements of a list fulfill predicate `p`.


#### any
```
List.any(p : 'a => bool, l : list('a)) : bool
```

Checks if any element of a list fulfills predicate `p`.


#### sum
```
List.sum(l : list(int)) : int
```

Sums elements of a list. Returns 0 if the list is empty.


#### product
```
List.product(l : list(int)) : int
```

Multiplies elements of a list. Returns 1 if the list is empty.


#### zip_with
```
List.zip_with(f : ('a, 'b) => 'c, l1 : list('a), l2 : list('b)) : list('c)
```

"zips" two lists with a function. n-th element of resulting list will be equal to `f(x1, x2)` where `x1` and `x2` are n-th elements of `l1` and `l2` respectively. Will cut off the tail of the longer list. For instance
```
zip_with((a, b) => a + b, [1,2], [1,2,3])
```
will yield `[2,4]`


#### zip
```
List.zip(l1 : list('a), l2 : list('b)) : list('a * 'b)
```

Special case of [zip_with](#zip_with) where the zipping function is `(a, b) => (a, b)`.

#### unzip
```
List.unzip(l : list('a * 'b)) : list('a) * list('b)
```

Opposite to the `zip` operation. Takes a list of pairs and returns pair of lists with respective elements on same indices.


#### merge
```
List.merge(lesser_cmp : ('a, 'a) => bool, l1 : list('a), l2 : list('a)) : list('a)
```

Merges two sorted lists into a single sorted list. O(length(l1) + length(l2))


#### sort
```
List.sort(lesser_cmp : ('a, 'a) => bool, l : list('a)) : list('a)
```

Sorts a list using given comparator. `lesser_cmp(x, y)` should return `true` iff `x < y`. If `lesser_cmp` is not transitive or there exists an element `x` such that `lesser_cmp(x, x)` or there exists a pair of elements `x` and `y` such that `lesser_cmp(x, y) && lesser_cmp(y, x)` then the result is undefined. O(length(l) * log_2(length(l))).


#### intersperse
```
List.intersperse(delim : 'a, l : list('a)) : list('a)
```

Intersperses elements of `l` with `delim`. Does nothing on empty lists and singletons. For instance
```
intersperse(0, [1, 2, 3, 4])
```
will yield `[1, 0, 2, 0, 3, 0, 4]`


#### enumerate
```
List.enumerate(l : list('a)) : list(int * 'a)
```

Equivalent to [zip](#zip) with `[0..length(l)]`, but slightly faster.


### Option

Common operations on `option` types and lists of `option`s.

Note: to use `Option` functions you need to `include "Option.aes"`

#### is_none
```
Option.is_none(o : option('a)) : bool
```

Returns true iff `o == None`


#### is_some
```
Option.is_some(o : option('a)) : bool
```

Returns true iff `o` is not `None`.


#### match
```
Option.match(n : 'b, s : 'a => 'b, o : option('a)) : 'b
```

Behaves like pattern matching on `option` using two case functions.


#### default
```
Option.default(def : 'a, o : option('a)) : 'a
```

Escapes `option` wrapping by providing default value for `None`.


#### force
```
Option.force(o : option('a)) : 'a
```

Forcefully escapes the `option` wrapping assuming it is `Some`.
Aborts on `None`.


#### force_msg
```
Option.force_msg(o : option('a), err : string) : 'a
```

Forcefully escapes the `option` wrapping assuming it is `Some`.
Aborts with `err` error message on `None`.


#### contains
```
Option.contains(e : 'a, o : option('a)) : bool
```
Returns `true` if and only if `o` contains element equal to `e`. Equivalent to `Option.match(false, x => x == e, o)`.


#### on_elem
```
Option.on_elem(o : option('a), f : 'a => unit) : unit
```

Evaluates `f` on element under `Some`. Does nothing on `None`.


#### map
```
Option.map(f : 'a => 'b, o : option('a)) : option('b)
```

Maps element under `Some`. Leaves `None` unchanged.


#### map2
```
Option.map2(f : ('a, 'b) => 'c, o1 : option('a), o2 : option('b)) : option('c)
```

Applies arity 2 function over two `option`s' elements. Returns `Some` iff both of `o1` and `o2` were `Some`, or `None` otherwise. For instance
```
map2((a, b) => a + b, Some(1), Some(2))
```
will yield `Some(3)` and
```
map2((a, b) => a + b, Some(1), None)
```
will yield `None`.


#### map3
```
Option.map3(f : ('a, 'b, 'c) => 'd, o1 : option('a), o2 : option('b), o3 : option('c)) : option('d)
```

Same as [map2](#map2) but with arity 3 function.


#### app_over
```
Option.app_over(f : option ('a => 'b), o : option('a)) : option('b)
```

Applies function under `option` over argument under `option`. If either of them is `None` the result will be `None` as well. For instance
```
app_over(Some((x) => x + 1), Some(1))
```
will yield `Some(2)` and
```
app_over(Some((x) => x + 1), None)
```
will yield `None`.


#### flat_map
```
Option.flat_map(f : 'a => option('b), o : option('a)) : option('b)
```

Performs monadic bind on an `option`. Extracts element from `o` (if present) and forms new `option` from it. For instance
```
flat_map((x) => Some(x + 1), Some(1))
```
will yield `Some(2)` and
```
flat_map((x) => Some(x + 1), None)
```
will yield `None`.


#### to_list
```
Option.to_list(o : option('a)) : list('a)
```

Turns `o` into an empty (if `None`) or singleton (if `Some`) list.


#### filter_options
```
Option.filter_options(l : list(option('a))) : list('a)
```

Removes `None`s from list and unpacks all remaining `Some`s. For instance
```
filter_options([Some(1), None, Some(2)])
```
will yield `[1, 2]`.


#### seq_options
```
Option.seq_options(l : list (option('a))) : option (list('a))
```

Tries to unpack all elements of a list from `Some`s. Returns `None` if at least element of `l` is `None`. For instance
```
seq_options([Some(1), Some(2)])
```
will yield `Some([1, 2])`, but
```
seq_options([Some(1), Some(2), None])
```
will yield `None`.


#### choose
```
Option.choose(o1 : option('a), o2 : option('a)) : option('a)
```

Out of two `option`s choose the one that is `Some`, or `None` if both are `None`s.


#### choose_first
```
Option.choose_first(l : list(option('a))) : option('a)
```

Same as [choose](#choose), but chooses from a list insted of two arguments.


### Pair

Common operations on 2-tuples.

Note: to use `Pair` functions you need to `include "Pair.aes"`

#### fst
```
Pair.fst(t : ('a * 'b)) : 'a
```

First element projection.


#### snd
```
Pair.snd(t : ('a * 'b)) : 'b
```

Second element projection.


#### map1
```
Pair.map1(f : 'a => 'c, t : ('a * 'b)) : ('c * 'b)
```

Applies function over first element.


#### map2
```
Pair.map2(f : 'b => 'c, t : ('a * 'b)) : ('a * 'c)
```

Applies function over second element.


#### bimap
```
Pair.bimap(f : 'a => 'c, g : 'b => 'd, t : ('a * 'b)) : ('c * 'd)
```

Applies functions over respective elements.


#### swap
```
Pair.swap(t : ('a * 'b)) : ('b * 'a)
```

Swaps elements.


### <a name='set-stdlib'>Set</a>

Note: to use `Set` functions you need to `include "Set.aes"`

#### Types

```
record set('a) = { to_map : map('a, unit) }
```

#### Functions

##### new

```
Set.new() : set('a)
```

Returns an empty set

##### member

```
member(e : 'a, s : set('a)) : bool
```

Checks if the element `e` is present in the set `s`

##### insert

```
insert(e : 'a, s : set('a)) : set('a)
```

Inserts the element `e` in the set `s`

##### delete

```
Set.delete(e : 'a, s : set('a)) : set('a)
```

Removes the element `e` from the set `s`

##### size

```
size(s : set('a)) : int
```

Returns the number of elements in the set `s`

##### to_list

```
Set.to_list(s : set('a)) : list('a)
```

Returns a list containing the elements of the set `s`

##### from_list

```
Set.from_list(l : list('a)) : set('a)
```

Turns the list `l` into a set

##### filter

```
Set.filter(p : 'a => bool, s : set('a)) : set('a)
```

Filters out elements of `s` that fulfill predicate `p`

##### fold

```
Set.fold(f : ('a, 'b) => 'b, acc : 'b, s : set('a)) : 'b
```

Folds the function `f` over every element in the set `s` and returns the final value of the accumulator `acc`.

##### subtract

```
Set.subtract(s1 : set('a), s2 : set('a)) : set('a)
```

Returns the elements of `s1` that are not members of `s2`

##### intersection

```
Set.intersection(s1 : set('a), s2 : set('a)) : set('a)
```

Returns the intersection of the two sets `s1` and `s2`

##### intersection_list

```
Set.intersection_list(sets : list(set('a))) : set('a)
```

Returns the intersection of all the sets in the given list

##### union

```
Set.union(s1 : set('a), s2 : set('a)) : set('a)
```

Returns the union of the two sets `s1` and `s2`

##### union_list

```
Set.union_list(sets : list(set('a))) : set('a)
```

Returns the union of all the sets in the given list


### String

Operations on the `string` type. A `string` is a UTF-8 encoded byte array.

Note: to use `String` functions you need to `include "String.aes"`

#### length
`length(s : string) : int`

The length of a string.

Note: not equivalent to byte size of the string, rather `List.length(String.to_list(s))`

#### concat
```
concat(s1 : string, s2 : string) : string
```

Concatenates `s1` and `s2`.

#### concats
```
concats(ss : list(string)) : string
```

Concatenates a list of strings.

#### to\_list
```
to_list(s : string) : list(char)
```

Converts a `string` to a list of `char` - the code points are normalized, but
composite characters are possibly converted to multiple `char`s. For example the
string "😜i̇" is converted to `[128540,105,775]` - where the smiley is the first
code point and the strangely dotted `i` becomes `[105, 775]`.

#### from\_list
```
from_list(cs : list(char)) : string
```

Converts a list of characters into a normalized UTF-8 string.

#### to\_lower
```
to_lower(s : string) : string
```

Converts a string to lowercase.

#### to\_upper
```
to_upper(s : string) : string
```

Converts a string to uppercase.

#### at
```
at(ix : int, s : string) : option(char)
```

Returns the character/codepoint at (zero-based) index `ix`. Basically the equivalent to
`List.nth(ix, String.to_list(s))`.

#### split
```
split(ix : int, s:string) : string * string
```

Splits a string at (zero-based) index `ix`.

#### contains
```
contains(str : string, pat : string) : option(int)
```

Searches for `pat` in `str`, returning `Some(ix)` if `pat` is a substring of
`str` starting at position `ix`, otherwise returns `None`.

#### tokens
```
tokens(str : string, pat : string) : list(string)
```

Splits `str` into tokens, `pat` is the divider of tokens.

#### to\_int
```
to_int(s : string) : option(int)
```

Converts a decimal ("123", "-253") or a hexadecimal ("0xa2f", "-0xBBB") string into
an integer. If the string doesn't contain a valid number `None` is returned.

#### to\_bytes
```
to_bytes(s : string) : bytes()
```

Converts string into byte array. String is UTF-8 encoded. I.e.
`String.length(s)` is not guaranteed to be equal to
`Bytes.size(String.to_bytes(s))`.

#### sha3
```
sha3(s : string) : hash
```

Computes the SHA3/Keccak hash of the string.

#### sha256
```
sha256(s : string) : hash
```

Computes the SHA256 hash of the string.

#### blake2b
```
blake2b(s : string) : hash
```

Computes the Blake2B hash of the string.


### Triple

Note: to use `Triple` functions you need to `include "Triple.aes"`

#### fst
```
Triple.fst(t : ('a * 'b * 'c)) : 'a
```

First element projection.


#### snd
```
Triple.snd(t : ('a * 'b * 'c)) : 'b
```

Second element projection.


#### thd
```
Triple.thd(t : ('a * 'b * 'c)) : 'c
```

Third element projection.


#### map1
```
Triple.map1(f : 'a => 'm, t : ('a * 'b * 'c)) : ('m * 'b * 'c)
```

Applies function over first element.


#### map2
```
Triple.map2(f : 'b => 'm, t : ('a * 'b * 'c)) : ('a * 'm * 'c)
```

Applies function over second element.


#### map3
```
Triple.map3(f : 'c => 'm, t : ('a * 'b * 'c)) : ('a * 'b * 'm)
```

Applies function over third element.


#### trimap
```
Triple.trimap(f : 'a => 'x, g : 'b => 'y, h : 'c => 'z, t : ('a * 'b * 'c)) : ('x * 'y * 'z)
```

Applies functions over respective elements.


#### swap
```
Triple.swap(t : ('a * 'b * 'c)) : ('c * 'b * 'a)
```

Swaps first and third element.


#### rotr
```
Triple.rotr(t : ('a * 'b * 'c)) : ('c * 'a * 'b)
```

Cyclic rotation of the elements to the right.


#### rotl
```
Triple.rotl(t : ('a * 'b * 'c)) : ('b * 'c * 'a)
```

Cyclic rotation of the elements to the left.
