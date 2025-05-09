---
header-includes:
  - \usepackage{enumitem}
  - \setlistdepth{20}
  - \renewlist{itemize}{itemize}{20}
  - \renewlist{enumerate}{enumerate}{20}
  - \setlist[itemize]{label=$\cdot$}
  - \setlist[itemize,1]{label=\textbullet}
  - \setlist[itemize,2]{label=--}
  - \setlist[itemize,3]{label=*}
---
# Periodically Syncing HyperChains
Yanislav Malahov, Erik Stenman, and the Aeternity team
December 2023


## Abstract
Building upon the initial concept of Hyperchains, this paper addresses key challenges in blockchain consensus mechanisms. The proposed solutions are designed to enhance blockchain networks' efficiency, security, and scalability, offering a comprehensive approach to overcoming existing limitations. This paper focuses on reducing the operational dependencies between child and parent chains in the Hyperchain architecture. We propose innovative methods to minimize the need for stakers to post to the parent chain, streamlining the process and reducing associated costs. This approach aims to alleviate the inefficiencies that arise from excessive interactions between the child and parent chains.
Addressing the risk of complete history rewrite attacks is another crucial aspect of our work. We introduce strategies to mitigate this risk, ensuring the integrity and continuity of the blockchain's historical records through pinning. Additionally, the paper provides solutions for handling situations where parent chains operate at varying speeds.
A noteworthy advancement presented in this paper is the pre-emptive leader election mechanism for the child chain. This innovation allows for more rapid finalization on the child chain, significantly increasing the speed and efficiency of transaction processing and consensus achievement. By enabling leader elections in advance, the system ensures swift and reliable finality, which is vital for the smooth operation of blockchain applications.


# Table of Contents
<!--  # Regenerate this -->
- [Periodically Syncing HyperChains](#periodically-syncing-hyperchains)
  - [Abstract](#abstract)
- [Table of Contents](#table-of-contents)
- [Introduction](#introduction)
- [The history of HyperChains](#the-history-of-hyperchains)
  - [2017 Whitepaper: Laying the Groundwork for æternity's Blockchain Innovation](#2017-whitepaper-laying-the-groundwork-for-æternitys-blockchain-innovation)
  - [2020 Whitepaper: Advanced Developments in æternity Blockchain](#2020-whitepaper-advanced-developments-in-æternity-blockchain)
  - [HyperChains evolution](#hyperchains-evolution)
  - [Periodically Syncing HyperChains](#periodically-syncing-hyperchains-1)
- [Problem Statement](#problem-statement)
- [Overview of Proposed Solution](#overview-of-proposed-solution)
  - [Future Leader Election](#future-leader-election)
  - [Periodic Syncing](#periodic-syncing)
  - [Consensus and Contracts](#consensus-and-contracts)
  - [Pinning](#pinning)
    - [Pinning format](#pinning-format)
    - [Third party pinning](#third-party-pinning)
  - [Child Chain](#child-chain)
- [Methodology](#methodology)
  - [Simulation](#simulation)
    - [Step 1: Simulating Chain Speed Variability](#step-1-simulating-chain-speed-variability)
    - [Step 2: Testing with Non-Productive Stakers](#step-2-testing-with-non-productive-stakers)
    - [Step 3: Evaluating the Use of Micro-Blocks](#step-3-evaluating-the-use-of-micro-blocks)
    - [Step 4: Assessing Resistance to Long-Term Attacks](#step-4-assessing-resistance-to-long-term-attacks)
  - [Review](#review)
    - [Community Feedback](#community-feedback)
    - [Expert Review](#expert-review)
    - [Continual Improvement](#continual-improvement)
- [In Depth Description of Proposed Solution](#in-depth-description-of-proposed-solution)
  - [Technical Details](#technical-details)
    - [Epochs](#epochs)
    - [Future Leader Election](#future-leader-election-1)
      - [Staking Cycle Structure](#staking-cycle-structure)
      - [Staking Contract Details](#staking-contract-details)
    - [Consensus Details](#consensus-details)
      - [Producer diagram](#producer-diagram)
      - [Observer Diagram](#observer-diagram)
      - [Fork Diagram](#fork-diagram)
      - [More...](#more)
    - [End of Epoch Fork Resolution](#end-of-epoch-fork-resolution)
      - [Objectives](#objectives)
      - [BFT Voting Process](#bft-voting-process)
      - [Detailed Transaction Encoding](#detailed-transaction-encoding)
      - [Timeouts](#timeouts)
        - [Setting Timeouts](#setting-timeouts)
        - [Handling Scenarios Where a Majority is Not Reached](#handling-scenarios-where-a-majority-is-not-reached)
        - [Handling Minority Vote in Finalization](#handling-minority-vote-in-finalization)
        - [Handling Double Voting](#handling-double-voting)
    - [Rewards and Penalties](#rewards-and-penalties)
      - [Rewards](#rewards)
      - [Penalties and Slashable Events](#penalties-and-slashable-events)
      - [Submitting Proof of Wrongdoings](#submitting-proof-of-wrongdoings)
    - [CC design](#cc-design)
  - [Block time specification](#block-time-specification)
    - [Block timing algorithm](#block-timing-algorithm)
- [Benefits and Advantages](#benefits-and-advantages)
- [Challenges and Limitations](#challenges-and-limitations)
- [Conclusion](#conclusion)
- [References](#references)


# Introduction
By Satoshi Nakamoto's introduction of Bitcoin in 2008 [11], the inception of blockchain technology marked a shift in digital transactions, establishing a decentralized framework for secure and transparent exchanges. The Proof-of-Work (PoW) consensus mechanism was central to this innovation, a groundbreaking approach that enabled a trustless and distributed ledger. PoW operates on a simple yet robust principle: it grants the right to add new blocks to the chain to those who expend computational energy to solve complex cryptographic puzzles. This method ensured security against fraudulent activities and laid the groundwork for the subsequent development of blockchain technology.
However, the limitations of PoW became increasingly apparent as the usage increased. The mechanism's intensive energy consumption was the most critical, which raised significant scalability and environmental sustainability concerns. Studies and reports began highlighting the enormous energy requirements of PoW blockchains, particularly Bitcoin, and their consequent carbon footprint [9]. These challenges spurred the search for alternative consensus mechanisms, leading to the early development of Proof-of-Stake (PoS) and Delegated Proof-of-Stake (DPoS).
In a proof-of-stake consensus algorithm, there is a deterministic choice to select the candidate to build the next block based upon some randomness obtained from the chain in such a way that the more stake a candidate has, the more likely that candidate is to be selected in that algorithm. These alternatives sought to reduce energy consumption by replacing the computational power requirement of PoW with the ownership stake in the network as the primary resource for achieving consensus [8].

The growing environmental concerns associated with PoW accelerated the shift towards more energy-efficient consensus mechanisms. The blockchain space also saw hybrid models that blended PoW and PoS features. These models aimed to strike a balance between the robust security of PoW and the energy efficiency of PoS. Concurrently, innovations such as sharding and layer 2 solutions have been gaining traction. These technologies promise enhanced scalability and efficiency, representing the ongoing evolution and diversification of consensus mechanisms in the blockchain ecosystem.

The "Nothing at Stake" dilemma presents a notable challenge in Proof-of-Stake (PoS) blockchains. This issue arises when the blockchain diverges into forks. Unlike in Proof-of-Work (PoW) systems, where miners must commit substantial computational resources to a single chain, making it costly to support multiple forks, PoS validators face no such constraints. In PoS, validators, or 'stakers', can endorse multiple blockchain forks simultaneously without incurring additional costs. This situation compromises the security and integrity of the blockchain, as it encourages validators to support multiple forks in the hope of maximizing rewards, regardless of the fork's legitimacy.

To address this predicament, some have proposed the concept of security deposits. In this model, validators must lock in their stakes for a certain period. They risk losing their deposited stakes if they are found to be supporting multiple forks — a practice that can be detected through mechanisms such as cross-referencing validation signatures. This approach introduces a tangible cost to malicious behavior, aligning the validators' incentives with the health and security of the blockchain.

However, this solution has its challenges. The detection of double validation can be complicated, especially if validators operate on a private fork and strategically release it at an opportune moment. This raises a pivotal question in the evolution of blockchain technology: Is there a more synergistic way to combine the strengths of PoS and PoW systems?

One intriguing possibility is the concept of checkpointing PoS chains within PoW chain transactions. This approach involves embedding a reference to the PoS chain's state within the transactions of a PoW chain. Such an integration could potentially leverage the robust security of PoW to enhance the stability of PoS systems. The implications of this hybrid approach are far-reaching and could redefine the interplay between different blockchain consensus mechanisms, leading to more secure and efficient blockchain networks.

Yanislav Malahov first presented this idea in a medium post. [https://yanislav.medium.com/hyperchains-secure-cheap-scalable-blockchain-technology-for-everyone-3ddec96a4152] It has since then been expanded upon in several steps, which we will describe in the history section.

In this whitepaper, we present further extensions to the Hyperchain solution that make it possible to minimize the need for stakers to post to the parent chain. We also address the problem of a complete history rewrite attack and how to handle parent chains that are too slow or too fast. We also provide a way to do leader elections in advance to have a fast finality on the child chain.

# The history of HyperChains
As described in the introduction, HyperChains began with a conceptual seed planted by Yanislav Malahov. In his Medium post [], Malahov introduced the world to Hyperchains, framing them as a robust solution to the limitations of existing blockchain systems. This foundational idea proposed a method to synergize the security strengths of Proof of Work (PoW) blockchains with the efficiency and scalability of Proof of Stake (PoS) systems, thus addressing critical issues like energy consumption and transaction throughput.

The core proposition of Malahov's Hyperchain concept revolved around leveraging established PoW blockchains, renowned for their robust security protocols, as parent chains. These parent chains would provide a secure, tamper-resistant foundation for more efficient child chains. Utilizing a PoS-like consensus mechanism, the child chains promised a drastic reduction in the energy consumption issues plaguing traditional PoW systems.
The Hyperchain model was envisioned as a hybrid, harnessing the best attributes of both PoW and PoS systems. By utilizing parent PoW chains for foundational security, Hyperchains aimed to mitigate the risk of attacks that are more feasible on less secure networks. Meanwhile, implementing PoS-like mechanisms on the child chains aimed to enhance scalability and reduce the overall resource footprint of blockchain operations. This laid the groundwork for a series of evolutionary steps in blockchain technology, leading to more refined and practical implementations of the Hyperchain concept. Malahov's vision set the stage for a new era of blockchain efficiency, security, and scalability, promising a transformative impact on how blockchain networks are designed and operated.
## 2017 Whitepaper: Laying the Groundwork for æternity's Blockchain Innovation
The 2017 "æternity Blockchain Whitepaper" lays the foundational concepts and technical vision for the æternity project. This paper emphasized scalability, efficiency, and user-friendly interfaces, all of which would become hallmarks of æternity's approach to blockchain technology.
At the heart of this whitepaper were several key technical innovations that set the stage for future advancements in the blockchain sphere. One of the most notable among these was the development of state channels. This technology promised a significant leap in blockchain scalability, allowing transactions to be processed off the main chain, thereby reducing congestion and increasing transaction speed. In tandem with this, the whitepaper introduced decentralized oracles, a mechanism designed to bridge the gap between real-world data and the blockchain, thereby vastly expanding the potential use cases for æternity's technology.
Another critical aspect discussed in the whitepaper was a unique governance mechanism. This mechanism aimed to ensure a more democratic and decentralized decision-making process within the blockchain network, reflecting a commitment to aligning the technical aspects of the blockchain with the ethos of decentralization.
However, the 2017 whitepaper acknowledged the initial challenges facing the æternity project. Among these were issues related to the scalability and integration of various blockchain components – challenges common in the nascent stages of blockchain development. These challenges were technical hurdles and opportunities for growth and improvement, setting the tone for future iterations and developments in the æternity blockchain.

## 2020 Whitepaper: Advanced Developments in æternity Blockchain
The 2020 whitepaper on the æternity blockchain, authored by the æternity dev team, addresses key challenges and enhances the foundational concepts established in the 2017 whitepaper.
A core focus of the 2020 whitepaper was to tackle the scalability challenges identified in the 2017 version. This was achieved by implementing state channels and the next generation of Nakamoto consensus algorithm (Bitcoin-NG), significantly increasing transaction throughput. The paper also delved into the efficient FATE virtual machine for smart contract execution to boost transaction processing speed and reduce latency.
The whitepaper elaborated on the development of state channels, an off-chain encrypted peer-to-peer communication protocol for the trustless execution of smart contracts. This innovation was key in increasing transaction throughput, allowing millions of transactions per second. Integrating decentralized oracles to bring external data onto the blockchain was also a crucial feature, enhancing the blockchain's utility in real-world applications.
Significant advancements were made in developing Sophia's smart contracts and the FATE virtual machine. Sophia, a functional language, was designed with security in mind, aiming to avoid common mistakes encountered in other contract languages. The FATE virtual machine, specifically designed for æternity, offered high security and efficiency standards, setting a new benchmark in smart contract execution.
The paper introduced a weighted delegated coin-voting mechanism in its governance model. This innovative approach allowed coin owners to delegate their voting power, providing a democratic and efficient way to signal preferences and make decisions within the blockchain network.
The 2020 whitepaper addressed the immediate challenges and advancements and laid out future ambitions for the æternity blockchain. This included discussions on formal verification, native tokens, computational integrity, and further scaling solutions. The paper also highlighted the differences from the v0.1 æternity blockchain whitepaper, showcasing the evolutionary journey of the blockchain.
## HyperChains evolution
The 2023 Hyperchain Whitepaper, "æternity Hyperchains: Recycling Power of Blockchains,"  [x] expands on Yanislav Malahov's Initial Concept. The paper, authored by Grzegorz Uriasz, Radosaw Rowicki, Vjacheslav Brichkovskiy, Ulf Wiger, and Dimitar Ivanov, significantly expands on the initial concept. This document goes deep into the technical aspects, challenges, and potential solutions of the Hyperchain concept, offering a comprehensive and evolved view of the technology.
The first HyperChain concept description has a DPoS child chain. Stakers and validators  register on the parent chain and then post commitments to the parent chain. They lock tokens on the child chain so they can be punished for misbehavior (for example, not producing blocks when expected). Chain difficulty is calculated according to the staking power of the fork.
Once an implementation was considered, some concepts were removed, others simplified, and other requirements were added. The paper elaborates on the hybrid strategy that combines the stability of PoW with the scalability of PoS. Inspired by Malahov's post, this approach benefits from the security of existing PoW networks while introducing a PoS-like election system for Hyperchains.
The whitepaper introduces the concept of parent (PoW) and child (PoS-like) chains. It proposes using established PoW chains like Bitcoin or Litecoin as parent chains to ensure the security and stability of the child Hyperchain.
Regarding technical innovations and challenges, the whitepaper lays out a detailed framework for the election process within Hyperchains. It describes a system where leaders of the child chain are chosen based on the block hash of the parent chain, ensuring a fair and unpredictable selection process. This method also helps mitigate risks associated with centralized control and bias in leader selection. Moreover, the whitepaper addresses several security concerns unique to Hyperchains, such as the "nothing at stake" issue, the potential for micro and generational forks, and the problem of lazy leaders. It proposes innovative solutions and preventative measures to address these challenges, showcasing the depth of thought and planning in the Hyperchain design.
The paper explains how Hyperchains can handle forks in the parent chain and potential attacks, highlighting the interdependent nature of the security of parent and child chains. It also discusses critical issues like finalization time and the possibility of stake collusion, proposing mechanisms to mitigate these risks and ensuring the smooth functioning and integrity of the Hyperchain network.
In conclusion, the whitepaper underscores the versatility, security, and environmental friendliness of Hyperchains. It positions them as a cost-effective and secure solution for blockchain creation and maintenance, suitable for a wide range of applications. The paper also recognizes the diversity in potential applications of Hyperchains, leaving many implementation details to the discretion of individual creators, acknowledging the importance of flexibility and adaptability in this rapidly evolving field.
Implementing the Hyperchain concept, as detailed in the whitepaper, led to some significant departures from the original idea proposed by Yanislav Malahov. These changes were driven by practical considerations encountered during the development and testing phases of the Hyperchain system. One of the notable modifications was the elimination of the registration step for participants in the leader election process. Instead of going through a formal registration, participants could now simply post a commitment, streamlining the process and making it more accessible. This change aimed to reduce bureaucratic overhead and simplify the entry process for potential leaders, thereby enhancing the system's efficiency and user-friendliness.
Another major alteration was the removal of the token-locking feature. Initially, it was envisioned that participants would need to lock in their tokens as a form of security or collateral. However, this requirement was later deemed unnecessary and was subsequently removed to simplify the operation of the Hyperchain. Doing so made the system more fluid and less restrictive, allowing for greater participation and reducing potential barriers for new entrants.
Similarly, the concept of punishing participants within the Hyperchain was also discarded. Initially, this was considered a way to enforce rules and maintain integrity within the system. However, upon further development, it was concluded that such a punitive approach might not be the most effective or necessary for maintaining order and compliance within the Hyperchain.
The whitepaper also significantly simplifies the relationship between the parent and child chains. In the implemented system, the child chain follows the parent chain in lockstep. This design choice was made to simplify the synchronization process between the two chains. However, this approach brought its own set of challenges. Following the parent chain in lockstep was found to be expensive and brittle, potentially leading to issues in scalability and resilience. This restriction, while simplifying certain aspects of Hyperchain's operation, also limits its flexibility and efficiency.
Implementing the Hyperchain concept brought about removing certain features from the original idea. These changes were primarily aimed at simplifying the system and making it more practical and user-friendly. However, they also introduced new challenges, particularly in terms of the cost and robustness of the system

## Periodically Syncing HyperChains
This paper proposes significant advancements in the Hyperchain concept, aiming to address the challenges identified in its initial development and implementation. Our proposal centers around design goals crucial for evolving the Hyperchain into a more efficient and practical blockchain solution. These goals reflect a strategic shift in our approach, targeting specific areas that require optimization and refinement.

One of the foremost goals we propose is to minimize the requirements for postings on the parent chain. We recognize that an over-reliance on the parent chain can lead to inefficiencies and escalate operational costs. To counter this, our proposal suggests reducing the frequency and volume of necessary postings. This approach is designed to streamline the Hyperchain's operations, making them more cost-effective and less cumbersome. Importantly, this simplification aims to uphold the integrity and security of the Hyperchain, ensuring that efficiency gains do not come at the expense of the system’s foundational robustness.

Furthermore, we propose removing the limitation that dictates the parent chain and the child chain must operate at the same speed. This restriction was pinpointed as a key factor contributing to the system's brittleness and inefficiency. Our solution allows for independent operation speeds between the parent and child chains. This flexibility is pivotal in addressing scalability challenges, enabling the Hyperchain to adapt to diverse operational needs and environmental conditions more effectively. By implementing this change, we aim to enhance the overall functionality and resilience of the Hyperchain system.

The modifications proposed in this paper are targeted at refining the Hyperchain technology. By reducing dependencies on the parent chain and introducing operational flexibility between the parent and child chains, we aim to develop a more adaptable, efficient, and robust blockchain solution.

# Problem Statement
To understand the problem better, let us assume a very naive way to piggyback on a different chain by just using the block hash of that parent chain as the random value for choosing the candidate on our chain. Create a list of stakeholders, possibly with multiple entries when a stakeholder has more than one stake. The parent chain block hash modulo the length of the stakeholder lists points to one element in the stakeholder list, and that is the candidate that may produce blocks, the leader, until the next block appears on the parent chain, after which the process is repeated. This solution has the following weaknesses:
There is a possibility that the miner on the parent chain can produce a hash that is favorable for one of the stakeholders.
It is unclear when the handover should happen. The leader may ignore the newly created parent block for some time, not producing a corresponding block and getting more transactions in its block to earn more.
Related but a different problem is detecting whether the leader candidate is active. If the leader cannot produce blocks, your chain cannot progress until the next block appears on the parent chain… how do you account for the previous leader's not producing any blocks?
The parent chain may fork. That is, your chain follows a blockchain fork that is later considered the wrong fork, and your chain needs to handle that.
These problems need to be addressed. Most likely, by posting transactions to the parent chain to show evidence that that chain is followed. This has a cost involved: the cost of posting transactions. It also introduces the problem of synchronization. If one posts a transaction to the parent chain, then only after a while is this visible to everyone and can be used to take action.



# Overview of Proposed Solution
<!-- Present the proposed solution
Highlight any innovative or unique aspects of the proposed solution. -->

## Future Leader Election
We propose a method where the child chain “elects” leaders for the Child Chain in advance, but we base our choices on the current state of the Parent Chain. It's like casting votes today for a leader who will take charge a few steps down the road. We do this in a way that when the Child Chain's chosen leader steps in, the Parent Chain has reached a 'safe state' for that moment. This 'safe state' means the information we use from the parent chain to decide is unlikely to change, ensuring consistency and security between the two chains.
Consider our HyperChain system as a time-synced mechanism where the future of the Child Chain is intricately tied to the past of the Parent Chain. In this system, when it's time to elect a new leader for the Child Chain, we don't just look at the present moment on the Parent Chain; instead, we turn our gaze X generations back, where X is larger than the longest known fork of the parent chain.
This backward glance ensures what we call 'finality' – a state where the events or transactions on the Parent Chain are confirmed and irreversible. By looking X generations back, we are checking that the landscape at that point in the Parent Chain’s history is stable and unchangeable. This historical snapshot is a firm foundation upon which we can securely base our leader election on the Child Chain.
This method is akin to making decisions based on a well-established history rather than the fleeting present. By anchoring our leader election process in the settled part of the Parent Chain, we provide an additional layer of security and reliability to the operations on the Child Chain.
Once a leader is chosen, there is a deterministic way to choose subsequent leaders on the child chain for Y generations until a new leader election occurs. This allows stakeholders to choose how much to stake to become a leader in a future leadership cycle.

```mermaid
sequenceDiagram
  participant S as Staker (an account address)
  participant V as Validator (a node)
  participant CC as Child Chain
  participant PC as Parent Chain

  rect rgb(10,60,10)
    note over CC: Staking epoch 1
    note over PC: PE(1)
      loop for each stakeholder
        S->>CC: Stake for Block production epoch 4
    end
    Note left of CC: Stakeholders influence future CC epoch 4 election through staking
  end

  rect rgb(20,80,20)
    note over CC: Entropy epoch 2
    note over PC: PE(2)
    S->>CC: Stake for Block production epoch 5, next cycle
    Note left of CC: (In the next cycle stakeholders influence future CC epoch 5 election through staking)
  end

  rect rgb(30,100,30)
    note over CC: Election epoch 3
    note over PC: PE(3)
    Note over PC: Finality Zone
    S->>CC: Stake for Block production epoch 6, next next cycle
    PC->>CC: Seed for Leader Election
 end

 rect rgb(40,120,40)
  note over CC: Block production epoch 4
  note over PC: PE(4)
  V->>CC: New leaders from epoch 1 stake
  loop for each validator
    V->>CC: Validate block
    S->>CC: Stake for Block production epoch 7, next next next cycle
    note over CC: Transactions
  end
 end

 rect rgb(50,140,50)
  note over CC: Payout epoch 5
  note over PC: PE(5)
  V->>CC: New leaders from epoch 2 stake
  CC->>S: Payout of rewards
  S->>CC: Stake for Block production epoch 8, next next next next cycle
end

```

After each epoch on the child chain, a critical process involves the pseudo-random number generator (PRNG), which is central to the leader selection mechanism in the HyperChain system. The PRNG is seeded with specific data points to ensure a fair and unbiased selection process. The first of these data points is the block hash from the corresponding epoch on the parent chain. By using this block hash as a seed, we ensure that the leader selection process on the child chain is intrinsically linked to the state of the parent chain, thereby leveraging the security and stability of the parent chain's consensus mechanism.
In addition to the parent chain's block hash, the PRNG is also seeded with the staking power data from the end of the previous epoch on the child chain. This inclusion is a strategic measure designed to prevent late manipulation of staking power. By fixing the staking power data at the end of each epoch, we establish a cutoff point that safeguards against any last-minute changes in stake distributions that could skew the leader election process. This dual-seeding approach of the PRNG — combining the parent chain's block hash and the child chain's staking power data — creates a robust and tamper-resistant mechanism for leader selection, upholding the principles of fairness and decentralization foundational to blockchain technology.


## Periodic Syncing
In our proposed model for HyperChains, we introduce a novel synchronization strategy between the parent and child chains. This approach is characterized by a semi-lock-step movement, where the epochs on the PC and CC are aligned to be approximately equal in duration, measured in wall-clock time. This synchronization method is crucial for maintaining a harmonious and efficient relationship between the two chains, ensuring that they operate in tandem while retaining a degree of independence.
The synchronization of chain speeds between the Parent Chain (PC) and the Child Chain (CC) is crucial. However, there may be instances where the speeds of these chains deviate from their intended pace. To address this, our HyperChain system incorporates mechanisms to adjust the synchronization parameters, ensuring that the PC and CC remain effectively aligned.

One of the key parameters in maintaining this synchronization is the 'child epoch length' (CEL), which dictates how quickly the CC moves in relation to the PC. If we observe that the chain speeds are diverging – for instance, if the CC is processing too quickly or slowly compared to the PC – we might need to adjust CEL. Altering this parameter would effectively recalibrate the pace of the CC, bringing it back into harmony with the PC.

Extending the duration of a generation can be a viable solution to synchronization issues. For example, if the CC moves too rapidly, lengthening its generation time could slow it down to match the PC's pace more closely. Conversely, shortening the generation time is generally less favorable, as it could lead to increased volatility and instability in the synchronization process.


Our system proposes a structured mechanism for proposing, validating, and (automatically) voting on these adjustments to ensure that any such adjustments are made judiciously and with consensus. This democratic approach involves several steps:


Proposal Submission: Stakeholder nodes in the HyperChain network that observe a deviation can submit proposals for adjusting CEL  as a special transaction.
Validation: Once a proposal is submitted, it undergoes a validation process. This stage involves other stakers confirming or denying that they observe a deviation.
Voting Process: After validation, the proposed change is automatically voted on among stakeholders.
Implementation: If the proposal is approved through voting, the adjustments are implemented at a given (or the next) generation.


This structured approach to managing chain speed deviations ensures that any necessary adjustments are made automatically based on consensus and a clear understanding of the network. It reinforces the adaptability and resilience of the HyperChain system, allowing it to respond effectively to changing operational dynamics.

## Consensus and Contracts

We implement part of the child chain by means of one or more smart contracts that will be deployed in the genesis block.
For example, there will be a staking contract that keeps track of the stakers at each height. Updates to these contracts is
performed by contract calls, which makes the state of the contracts visible on-chain.

The main contract must be aware of the five staking cycles and keeps track of those five cycles independently.
At the end of a child epoch, the state is updated and the epochs shift taking the correct parameters into account.

The epoch length can be adjusted within a cycle by having the last leader of the production epoch propose decrease or increase of the length.
During the next epoch, votes can be collected and the result is again posted in the last block of that epoch.
If there is a majority vote for the same speed change, then the epoch thereafter will have that demanded new epoch length.
Concrete proposal:
Any leader can add a contract call transaction `increase_epoch_length(N)` or `decrease_epoch_length(N)` with N a positive integer (`> 0` and `<` some sensible max).
The contract state counts these for the ongoing production epoch and at the end of the production epoch some weighted average of increases and decreases.
```
FORMULA HERE
```
At the end of that epoch this results in a proposed change for the next production epoch, in which leaders vote on it by a contract call (yes or no).
If accepted, then the production epoch thereafter starts with this new epoch length.




## Pinning
We introduce a strategic mechanism to establish and maintain the synchronization between the Child Chain (CC) and the Parent Chain (PC), known as the 'pinning action.' This method serves as a crucial link, ensuring the CC is securely anchored to the state of the PC, thereby leveraging its security attributes.


The pinning process is designed to be an incentivized action within each generation of the CC. In every generation, one staker is randomly selected based on their stake power to perform this pinning action. This selection process ensures that the responsibility for pinning is distributed fairly among participants and is proportional to their stake in the network, fostering a sense of collective responsibility and participation.


The pinning action itself involves several key steps. Firstly, the selected staker commits a specific data or transaction to the CC. This commitment is then cryptographically signed or hashed, creating a unique and tamper-evident record. The staker then posts the signed or hashed data onto the PC. This action effectively 'pins' the state of the CC to a specific point in the PC, creating a verifiable and secure link between the two chains.


Once the data is posted on the PC, the staker writes a Proof of Inclusion (PoI) onto the CC. This PoI verifies that the transaction or data exists on the PC, completing the pinning process. The PoI is critical as it allows nodes on the CC to independently verify the pinning without needing to access the entire history of the PC, thus maintaining efficiency and scalability.


Our system incorporates a reward mechanism to encourage stakers to perform this vital pinning action. Performing a pinning action entitles the staker to receive a specific reward. If a pinning action is not performed in a given generation, the reward allocated for that action is carried over to the next block, increasing the incentive for the next selected staker. This cumulative reward strategy ensures that even if pinning is momentarily overlooked or missed, the increasing reward is a compelling motivation for subsequent stakers to act. The reward is reset once a successful pinning action is completed, maintaining the cycle of incentive and participation.

```mermaid
sequenceDiagram
    participant CC as Child Chain
    participant S as Stakeholders
    actor User as Anyone<br>(often Stakeholder)
    participant PC as Parent Chain

    loop every generation in CC

      User -->> PC: PIN CC observed previous Epoch
      loop Block production
        CC->>S: "Select Staker based on epoch schedule"
        S->>CC: Commit block to CC
      end
      User -> PC: observe Hash of PIN transaction
      User -->> S: Hash of PIN transaction
      loop Block production
        CC->>S: "Select Staker based on epoch schedule"
        S->>CC: Commit block to CC
      end
      CC->>S: "Select last Staker based on epoch schedule"
      S-->PC: Verify valid and final PIN hash
      S->>CC: Last block (Proof of Pinning)
    end

   Note left of CC: Pinning action synchronizes CC with PC
   Note right of S: Rewards incentivize stakers
```

### Pinning format

The transaction posted to the PC is a hash of the following data derived from a specific block on the CC:
- The block hash
- The block height
- The epoch in which that block appears

This hash is posted to the PC.
When the transaction has been added to the PC and the PC block in which it is accepted gets final,
then a reward can be obtained and in that reward post, the components above are included as well as the PC block hash and PC tx hash.
Any CC verifier can then validate that this is a block on the CC that is elegiable to be used for pinning (too old blocks are not).
The CC verifier can compute the same hash, retrieve the PC transaction by tx hash provided and compare that indeed this transacation contains that right hash.
The CC verifier can verify that the block in which the hash appears is finite. If so, the reward and therefore pinning is valid.

### Third party pinning

In the above, it is assumed that the last leader has posted the pinning transaction on the parent chain.
In that way, the last leader knows the transaction hash of the pinning transaction, can follow it and knows in which block it
appears on the parent chain.

But there is no demand to post a pinning transaction, hence the last leader may not find the reward attractive enough to
do so. At the same time, another child chain account (not necessary a stakeholder, but just anyone), could have interest
in pinning the child chain to assure value on chain.

We would like this third party to be able to post the pinning transaction, tell the last leader about it and have the last leader
collect its reward. The incentive for doing that is most likely large enough to not ignore this possibility.

Any third party can compute the necessary valid pinning transaction and can post it on chain. After that, however, it needs
to communicate the tx-hash obtained from the parent chain to the last leader.
There are a number of possibilities to do so, which all require a bit of engineering. We should choose one of them as default.
(Note that although the public key of the last leader is known, the actual node's IP address is not a-priory known).

1. Each leader uses AENS names to post a URL on which it can be contacted for such tx-hashes
2. The third party can do a spend tx to the last leader with specific payload: "PIN#TxHash".
3. The child chain could have a special pin contract that third party can create a call tx for including the tx-hash of parent chain.

The advantage with solution 2 and 3 is that the transaction is automatically gossiped and that there is even an onchain trace.
A contract would have to be able to store multiple tx-hashes per epoch, to have last leader collect one of them that is valid and final.
Contract calls are more expensive than spend transactions.

The first alternative does not cost any additional child tokens for the third party, but partly reveals leaders privacy
(the advertised URL need not at all be the same as the node URL and therefore attacks to it may not be equally harmful
as blocking the node). Disadvantage that it is not gossiped and that if the last leader cannot produce the block, but another leader can,
then the pin is possibly gone missing.

The contract solution is more flexible than a spend, for example could the last leader do a payback of the reward or part of it when
using a third party tx-hash.

## Child Chain
Addressing the operational specifics of running the Child Chain (CC) in the HyperChain framework presents a complex and evolving challenge. The design of the CC, as proposed, diverges from the traditional model of an Aeternity (AE) node using a Proof of Stake (PoS) consensus mechanism. This deviation is driven by the unique requirements and objectives of the HyperChain system, which necessitates a more specialized approach to chain management and consensus.


The rationale behind not employing a standard AE node with PoS for the CC stems from the need to accommodate the distinctive features of the HyperChain architecture. These include the integration with the Parent Chain (PC), the implementation of the pinning mechanism, and the specific consensus requirements that arise from the semi-lock-step synchronization with the PC. The conventional AE node with PoS may not be adequately equipped to handle these specialized demands without significant modifications.


However, the goal is to develop a CC system that is not radically different from the conventional AE node with PoS. This approach is advantageous for several reasons. Firstly, it allows for leveraging the existing infrastructure and knowledge base surrounding AE nodes, facilitating a smoother transition and quicker adoption. Secondly, maintaining some continuity with the established PoS system helps preserve the inherent benefits of PoS, such as energy efficiency and reduced centralization, which are key to the ethos of blockchain technology.


To achieve this, we envision a CC system that incorporates the fundamental principles and mechanisms of a PoS system but is adapted and expanded to align with the HyperChain model. This might involve integrating additional modules or mechanisms to handle the pinning actions, adjusting the leader selection algorithm to synchronize with the PC, and implementing new security measures to address the unique risks associated with the HyperChain structure.


Developing this CC system is an ongoing process, requiring careful consideration of each design choice's technical and practical implications. The objective is to strike a balance between the innovation necessary for the HyperChain model and the stability and efficiency of traditional PoS systems


![hyperchain diagram](images/PeriodicallySyncingHyperChains.png)




# Methodology
Present the proposed methodology to ensure the feasibility of the solution
Provide detailed explanations, diagrams, or models as necessary.

## Simulation
The synchronization of the Parent Chain (PC) and the Child Chain (CC) is a critical component, and there are many uncertainties, especially in edge cases. These uncertainties include the behavior of synchronization over an extended period and the overall viability of the solution under varying conditions. To address these uncertainties and identify potential issues, we propose a comprehensive simulation of the HyperChain system. This simulation will be conducted in several steps, each designed to test different aspects of the system's functionality and resilience.

### Step 1: Simulating Chain Speed Variability
The first step in our simulation process is implementing a program that models the PC and CC operating at different speeds. The goal is to observe whether the two chains can remain effectively synchronized over a prolonged period, spanning 10 million blocks. This simulation will test the chains under stable conditions and introduce variability in the speed of block production. For example, one chain might gradually slow down compared to the other. This test will help us understand the robustness of our synchronization mechanism under dynamic conditions and whether it can adapt to changes in chain speeds over time.

Given a parent chain (PC) with a block time of approximately 10s and a goal of a child chain block time of 1s we configure our child chain as follows:
```json
  {
    'ParentChain': "ParentChain",
    'ParentEpoch': 10,
    'ParentFinality': 5,
    'LeaderPool': [ {'Leader': "validator1",
                     'Stake': 100
                    }
                  ],
    'StartBlock': 100,
    'ChildEpoch': 100,
    'BlockTime': 1000
  }
```

```mermaid
sequenceDiagram
    participant Validator3
    participant Validator2
    participant Validator1
    participant ChildChain
    participant ParentChain

    Note over Validator1,ChildChain: LeaderPool: [{ "validator1", 100 }]

    Note over ParentChain: Block 100
    Note over ParentChain: ...
    Note over ParentChain: Block 105
    ParentChain--xValidator1: See HashPC100
    ParentChain--xValidator1: See Height 105 (SB+F)
    Note over Validator1,ChildChain: RandomSeed = PC100

    rect rgb(140, 240, 140)
      note right of ChildChain: CE1
      Validator1->>+ChildChain: Produce block 1
      Note over ChildChain: Block 1
      Note over ChildChain: Blocks ...
      Validator2-->>+ChildChain: Stake 100
      Validator3-->>+ChildChain: Stake 50
      Note over ParentChain: Block 110
      Note over ChildChain: Blocks ...
      Validator1->>+ChildChain: Produce block 100
      Note over ChildChain: Block 100
      ParentChain--xValidator1: See HashPC110
      ParentChain--xValidator1: See Height 115 (2*SB+F)
      Note over Validator1,ChildChain: LeaderPool:<br/> [{ "validator1", 100 }], <br/>NextLeaderPool:<br/> [{ "validator1", 100 },<br/> { "validator2", 100 },<br/> { "validator1", 50 }]
    end
```

In epoch 2 on the child chain we still use the original leader pool.
```mermaid
sequenceDiagram
    participant Validator3
    participant Validator2
    participant Validator1
    participant ChildChain
    participant ParentChain

    Note over Validator1,ChildChain: RandomSeed = PC110
    rect rgb(150, 250, 150)
    note right of ChildChain: CG2
    Validator1->>+ChildChain: Produce block 101
    Note over ChildChain: Block 101
    Note over ParentChain: Block 120
    Validator1->>+ChildChain: Produce block 200
    Note over ChildChain: Block 200
    ParentChain--xValidator1: See HashPC120
    ParentChain--xValidator1: See Height 125 (3*SB+F)
    Note over Validator1,ChildChain: L={1:100, 2:100, 3:50}
    Note over Validator1,ChildChain: LeaderPool:<br/> [{ "validator1", 100 },<br/> { "validator2", 100 },<br/> { "validator1", 50 }]
    end
```
In epoch 3 on the child chain we start using the new leader pool.

```mermaid
sequenceDiagram
    participant Validator3
    participant Validator2
    participant Validator1
    participant ChildChain
    participant ParentChain

    Note over Validator1,ChildChain: RandomSeed = PC120
    rect rgb(150, 250, 150)
    note right of ChildChain: CE3
    Validator2->>+ChildChain: Produce block 200
    Note over ChildChain: Block 200
    Validator3->>+ChildChain: Produce block 201
    Note over ChildChain: Block 201
    Validator2->>+ChildChain: Produce block 202
    Note over ChildChain: Block 202
    Validator1->>+ChildChain: Produce block 203
    Note over ChildChain: Block 203
    Note over ChildChain: Blocks ...
    Validator1->>+ChildChain: Produce block 299
    Note over ChildChain: Block 299
    Note over ParentChain: Block 130
    ParentChain--xValidator1: See HashPC130
    ParentChain--xValidator1: See Height 135 (4*SB+F)
    Note over Validator1,ChildChain: L={1:100, 2:100, 3:50}
    end
```

### Step 2: Testing with Non-Productive Stakers
The second step focuses on simulating the behavior of stakers who do not produce blocks. In a real-world scenario, there might be stakers who, for various reasons, fail to fulfill their block production responsibilities. This part of the simulation aims to assess the impact of such inactive stakers on the overall functionality and security of the HyperChain. It will help us identify potential risks and formulate strategies to mitigate them, ensuring the system's smooth operation even when faced with participant inactivity.
We also need to simulate slow stakers and how to decide when and how other stakers should be allowed to take over validation.

### Step 3: Evaluating the Use of Micro-Blocks
In this step, we revisit the concept of micro-blocks within the HyperChain system. The simulation will explore whether incorporating micro-blocks would be beneficial or detrimental to the system's performance. While micro-blocks can offer certain advantages, such as increased throughput, they might also introduce complexity or security concerns. This step will help us make an informed decision on whether to include micro-blocks in the HyperChain framework.

### Step 4: Assessing Resistance to Long-Term Attacks
Finally, the simulation will focus on the system's resilience against long-term attacks. These are sophisticated attacks where malicious actors attempt to exploit the blockchain over an extended period. The simulation will recreate scenarios of such attacks to evaluate how well the HyperChain can withstand them. This step is crucial for ensuring the long-term security and reliability of the system, providing insights into potential vulnerabilities and how they can be addressed.

## Review
Every modification to a blockchain's consensus algorithm carries with it the potential for unforeseen consequences, particularly regarding security and system integrity. This is especially true for novel and comprehensive solutions like Hyperchains, which significantly depart from traditional blockchain models. Therefore, it's crucial to approach these changes with caution and thoroughness.
Hyperchains, by their innovative approach to blockchain consensus, necessitate an exhaustive review process. This process is about ensuring that the system functions as intended and identifying and mitigating any vulnerabilities the new system could introduce. What may seem like minor changes can have far-reaching implications on the overall security and functionality of the system.
One of the key areas of focus in this review process is the examination of the incentive structures, fees, and punitive measures integrated into the Hyperchain system. Each element is crucial in guiding user behavior and securing the network. However, they also represent potential avenues for exploitation. Malicious actors might find ways to game the system, exploiting loopholes in the incentive structures, manipulating transaction fees, or evading punitive measures. Such vulnerabilities could compromise the integrity of the Hyperchain, leading to issues like double-spending, network congestion, or even total system failure.
To address these concerns, our approach involves an extensive feedback and review process that engages the blockchain community and experts in blockchain technology and security. This collaborative effort is vital for several reasons:
### Community Feedback
The blockchain community, comprising users, developers, and enthusiasts, often provides practical insights and identifies potential issues from a user-centric perspective. Their diverse experiences and understanding of blockchain systems can be invaluable in spotting oversights and suggesting improvements.
### Expert Review
Engaging with blockchain and security experts allows us to leverage their deep technical knowledge and experience in system security. These experts can provide a more theoretical and technical analysis of the Hyperchain system, identifying potential vulnerabilities and proposing robust solutions to mitigate them.

Collaborative Problem-Solving: By combining community feedback with expert analysis, we can foster a comprehensive review process. This collaboration enables a balanced approach, ensuring the system is user-friendly and secure from a practical and technical standpoint.
### Continual Improvement
The feedback and review process is not a one-time but an ongoing effort. As the Hyperchain system evolves and new threats emerge, continuous engagement with the community and experts will be crucial for maintaining the system's integrity and relevance.




# In Depth Description of Proposed Solution
After doing the needed experiments and simulations, present the suggested solution in detail-.
* Provide detailed explanations, diagrams, or models as necessary.
## Technical Details


### Epochs
Introduce an epoch length for both the parent chain `PEL` (in the rest of the document, let's assume it is 10), and the child chain `CEL`. The `CEL` in this paper is initial 100, ten times the amount of the parent chain. This means that after producing 100 blocks on the child chain, we expect to have progressed one parent chain epoch.
(We may refer to this speed as `EOff` = 10, which
means there are 10 times as many blocks on the child chain).
We will adapt the child epoch length via a voting strategy. Each child chain can observe the parent chain and observe whether the child chain seems to produce its blocks too fast or too slow. A proposal can be submitted to the child chain on which all stake holders can vote. By two third majority, the vote to make a child epoch longer or shorter is accepted. Changing the epoch length is under consensus in this way. (How much longer or shorter is provided by a standard function that makes sure we see a smooth adjustment).


Also consider a constant number of blocks on the parent chain that represents
it's confirmation depth (`CD`) - this number should be picked large enough that
a fork this long is _highly_ improbable. I.e. we consider the _top_ of the
parent chain being `CD` blocks from the _actual_ top.


Bootstrap the CC by configuring the initial stake distribution and then pick a
suitable block to start the first generation on the PC. The suitable block hash
should go into the initial setup, and be part of the PRNG for electing leaders
for the first CC generation.


At the end of the first CC epoch (the staking epoch) the current state of the stake
distribution is recorded - to be used in the third epoch (block production and pinning epoch)! The correct
block hash is fetched from the PC and fed into the PRNG for electing leaders
(still) together with the initial stake distribution.


At the end of the second epoch (the leader (s)election epoch) _normal_ operation commences. PRNG is fed
the correct block hash from PC and the stake distribution at the end of last
epoch (the payout epoch), the current stake distribution is recorded, etc.


If the chains runs at about the same relative speed this can then be repeated
forever; with pinning actions happening as often as the rewards incentivize it.

### Future Leader Election

The "leader election contract" is set up by the chain initiator.
This contract allows participants to register for leader selection by depositing
a minimum staking amount, referred to as `MINIMUM_STAKE`.
Participants may choose to deposit more than the minimum to cover potential penalties,
which could otherwise disqualify them from being elected as a leader.

The contract provides `deposit` and `withdraw` functions to adjust the deposited amount.

You can not withdraw funds if the deposited balance would go under `MINIMUM_STAKE`
if you have tokens at stake.

#### Staking Cycle Structure

Each epoch needs a schedule of producers. These producers are randomly selected from registered stakers.
The election procedure has following goals:
- To prevent stakers to influence the schedule, the staking distribution should be known before the seed of the random selection is known.
- The seed should be final (that is it should be guaranteed not to disappear from the parent chain due to forking)
- The seed should be known before the actual schedule needs to be computed, otherwise the child chain is stuck
- The stakers should actually do work, so only after the work is done, their rewards for doing the work is paid out.

This leads to a design with of a staking cycle that consists of five distinct phases:

1. **Staking epoch**: Participants register and adjust their stakes.
   In the staking phase, we collect all stakes posted in the ongoing child epoch. The result at the Nth child epoch CE<sub>n</sub> is referred to as s<sub>n</sub>.  The initial stake as configured for the child chain is s<sub>0</sub>.

2. **Entropy Epoch**: Waiting for the parent chain to produce the hash used for entropy.

3. **Leader Election epoch**: The system uses the state of the parent chain and the stakes recorded to generate a schedule for selecting leaders.
   In the leader election phase we retrieve the first hash of a parent chain epoch to be used as a seed later on. For CE<sub>n</sub> we store the first blockhash of PE<sub>n-1</sub> as seed for later schedule computation.
   Note that effectively at this moment we know the schedule for block production 2 epochs ahead. Among others, future stakers now can be more attentive.
4. **Block Production epoch**: Only validators meeting the minimum staking requirements are eligible to produce blocks.
   The schedule for CE<sub>n</sub> block production is based upon the stake set s<sub>n-5</sub> produced in CE<sub>n-5</sub> and the seed from the first block of PE<sub>n-3</sub>
5. **Payout epoch**: Rewards are distributed based on block production results.

Note that each child epoch has all of these characteristics, viz. child epoch nine is the payout  phase for a cycle
that started in a staking phase in the past (child epoch four as we will see).
But it also starts a new staking epoch for future block production.

However, we do have a different situation at the start.
For example, when starting the chain, there cannot be a payouts, since there's nothing produced.
Luckily the initial stakers s<sub>0</sub> are part of the configuration/contract when starting the chain. Thus it is fine to take the configured parent start height
as the first block to take entropy from. But since we have unknown seeds for a while, we decide to start by replaying the schedule
based upon the start height block hash and the configured initial stake 4 times.

Alternative solutions would have been to take parent hashes before the start height, since the parent is alive for a while before we start a child chain. The disadvantage there is that it might be confusing for the manual validator of hashes on parent chain that we use hashes before the start height.
Another alternative would be to use the start height and initial staking to compute a random schedule that is 4 epochs long and then use the right part for each of the first four epochs. Disadvantage then is that we need another validation logic for the first 4 epochs.
The risk of re-using the schedule for the first 4 epochs is at most that one of the initial stakers gets a bit of an advantage.


The start of the chain looks as follows (wait until parent start height is final):

epoch 1 (CE<sub>1</sub>):
- **Staking epoch** use the configured stake
- **Entropy Epoch** no actions
- **Leader Election Epoch** ensure finality of `parent_start_height`
- **Block Producer Epoch** use the schedule based upon configured stake s<sub>0</sub> and `parent_start_height` for entropy
- **Payout Epoch** no actions

epoch 2 (CE<sub>2</sub>):
- **Staking epoch** staking distribution s<sub>1</sub> from staking during block producing epoch CE<sub>1</sub>
- **Entropy Epoch** no actions
- **Leader Election Epoch** ensure finality of `parent_start_height`
- **Block Producer Epoch** use the schedule based upon configured stake s<sub>0</sub> and `parent_start_height` for entropy
- **Payout Epoch** use results of CE<sub>1</sub> block production epoch

epoch 3 (CE<sub>3</sub>):
- **Staking epoch** staking distribution s<sub>2</sub> from staking during block producing CE<sub>2</sub>
- **Entropy Epoch** no actions
- **Leader Election Epoch** ensure finality of **first hash of PE<sub>1</sub>** (which is `parent_start height`)
- **Block Producer Epoch** use the schedule based upon configured stake s<sub>0</sub> and `parent_start_height` for entropy
- **Payout Epoch** use results of CE<sub>2</sub>* block production epoch

epoch 4 (CE<sub>4</sub>):
- **Staking epoch** staking distribution s<sub>3</sub> from staking during block producing epoch CE<sub>3</sub>
- **Entropy Epoch** no actions
- **Leader Election Epoch** ensure finality of **first block of PE<sub>2</sub>**
- **Block Producer Epoch** use the schedule based upon configured stake s<sub>0</sub> and **first hash of PE<sub>1</sub>**  for entropy
- **Payout Epoch** use results of CE<sub>3</sub> block production epoch

epoch 5 (CE<sub>5</sub>):
- **Staking epoch** staking distribution s<sub>4</sub> from staking during block producing CE<sub>4</sub>
- **Entropy Epoch** no actions
- **Leader Election Epoch** ensure finality of **first block of PE<sub>3</sub>**
- **Block Producer Epoch** use the schedule based upon configured stake s<sub>0</sub> and **first block of PE<sub>2</sub>** for entropy
- **Payout Epoch** use results of CE<sub>4</sub> block production epoch

epoch 6 (CE<sub>6</sub>):
- **Staking epoch** staking distribution s<sub>5</sub> from staking during block producing CE<sub>5</sub>
- **Entropy Epoch** no actions
- **Leader Election Epoch** ensure finality of **first block of PE<sub>4</sub>**
- **Block Producer Epoch** use the schedule based upon **s<sub>1</sub>** and **first block of PE<sub>3</sub>** for entropy
- **Payout Epoch** use results of epoch 5 block production epoch

and for the Nth epoch:

epoch N (CE<sub>n</sub>):
- **Staking epoch** staking distribution s<sub>max(n-1, 0)</sub> from staking during block producing CE<sub>max(n-1, 0)</sub>
- **Entropy Epoch** no actions
- **Leader Election Epoch** ensure finality of **first block of PE<sub>max(n-1, 0)</sub>**
- **Block Producer Epoch** use the schedule based upon **s<sub>max(n-3, 0)</sub>** and **first block of PE<sub>max(n-3, 0)</sub>** for entropy
- **Payout Epoch** use results of epoch n-1 block production epoch


#### Staking Contract Details
- The staking contract includes a `tokens_at_stake` field, representing the number of
tokens staked for the upcoming block production epoch.
- During the staking epoch, this value is set based on delegator's deposits.
- At the end of the leader election epoch, the leader election contract creates a leader
 schedule using a hash from the parent chain and the `tokens_at_stake` data for all eligible staking contracts.
- The leader election contract stores each validator's `tokens_at_stake`.

See [staking.md](staking.md) for details (to be worked in here).

During the block production epoch, blocks are considered valid only if they are produced by validators who have at least the `tokens_at_stake` in (their deposit in the election contract + their token balance in the staking contract) and at least `MINIMUM_STAKE` deposited in the election contract. (A penalty could bring your balance
below `MINIMUM_STAKE`.)

### Consensus Details

For hyperchains we calculate the "difficulty" of a normal block as the difficulty of the preceding
block + 1. The difficulty of a hole is the same as the difficulty of the preceding block.
Choosing the best fork is done by choosing the block with the highest difficulty.
The block with the highest height is better for blocks with the same difficulty.

When a vote for a fork gets 2/3 of the stake the difficulty of the block containing that vote will be
updated so that difficulty is set to the height.

#### Producer diagram

```mermaid
graph TD
    start["Node is started"]
    producer{"Are you in the schedule"}
    n0["Have: Staking distribution
    Random seed from ParentChain"]
    n3["Build: Producer Schedule
    mix stakers following the random seed and one known algorithm"]
    n1["Have: Start of Epoch Timestamp"]
    n2["Start an Epoch"]

    n4["Start a Timeslot"]
    n5["From producer schedule Choose producer"]
    n6{"Is it your time slot"}
    n7["Keep collecting gossip 'blocks'"]
    n8{"Look if you have single complete chain"}
    n12["Produce a 'block'"]
    n10["Choose best fork
    See fork diagram"]
    n11["Fill slots with blanks
    if first block is missing, its a blank too"]
    n9{"Is it the last block of the epoch"}
    lastp["Last block:Voting 3x blocktime block"]
    last{"Is it the last block"}
    voting{"Is voting stared"}
    vote["Vote on speed and fork"]
    become_last_leader{"Are you the next leader"}

    start --> n3

    n0 --> n1
    n1 --> n2
    n3 --> n0
    n2 --> producer
    producer -->|NO|go_to_observer_diagram
    producer -->|YES| n4

    n4 --> n5
    n5 --> n6
    n6 -->|NO| last
    n6 -->|YES| n8

    n7 --> |Throw away invalid blocks| n7
    n7 --> |Timeslot end| n4


    n8 -->|YES| n9
    n8 -->|MULTIPLE FORK| n10
    n8 -->|INCOMPLETE| n11

    n9 -->|NO| n12
    n11 --> n9
    n10 --> n9
    n12 -->|NO| n4
    n9 -->|YES| lastp

    lastp --> n3

    last -->|YES| voting
    voting -->|YES| vote
    voting -->|NO| become_last_leader
    last -->|NO| n7
    vote --> n3
    become_last_leader -->|YES| lastp
    become_last_leader -->|No| voting


 ```

#### Observer Diagram

```mermaid
graph TD
    start["Node is started"]

    start --> observer

    observer --> |valid block:add| observer
    observer --> |invalid block| invalid

    invalid --> |Penalty offense| penalty
    invalid --> |No penalty| observer
    penalty --> |Post proof of misconduct| observer

 ```

See [Penalties and Slashable Events](#penalties-and-slashable-events).


#### Fork Diagram

```mermaid
graph TD
    n19["To choose the best fork
    count the 'holes' of each fork"]
    n20{"Is there a single fork with fewest 'holes'"}
    bad_chain{"Are there multiple full chains?"}
    penalty["Prepare proof of all 'double' blocks in same slot.
     Post proof of missconduct.
     Fill all 'double' blocks with 'holes' "]
    n21["Prefer chain with holes early"]
    done["pick that fork"]


    n19 --> n20
    n20 --> |YES| done
    n20 --> |NO| bad_chain
    bad_chain --> |YES| penalty
    penalty --> done
    bad_chain --> |NO| n21
    n21 --> done
 ```


### End of Epoch Fork Resolution

A Byzantine Fault Tolerant (BFT) voting mechanism is proposed to allow producers to reach consensus on the correct fork.

#### Objectives

The main objectives of this proposal are:

1. **Ensure Security and Decentralization**: Provide a secure method for producers to propose and vote on forks without relying on centralized authorities.
2. **Maintain Efficiency**: Use minimal overhead to keep transaction costs low while ensuring robust consensus.

#### BFT Voting Process

##### Vote types
1. **Fork**: a vote on which fork to follow
2. **Speed of chain**: vote on the speed of the chain using the epoch delta length (positive to slow down, negative to speed up).

The BFT voting process involves three main phases: Proposal, Voting, and Finalization. Each phase utilizes vote transactions to communicate and reach consensus.

1. **Proposal Phase**:
    - At the end of each epoch, a designated producer (i.e., the last leader) initiates the fork selection process by broadcasting:
        - A Fork Proposal transaction.
        - A Speed of Chain Proposal transaction (for proposing changes to epoch length).
    - The proposal transactions are added to the vote pool, making them visible to all validators.

2. **Voting Phase**:
    - Producers monitor the vote pool for incoming proposal transactions.
    - Upon detecting valid proposals, they verify the contents and broadcast their Vote transactions indicating support for:
        - The proposed fork.
        - The proposed epoch length delta.

3. **Finalization Phase**:
    - If a proposal gathers support from more than two-thirds of the total stake, producers generate a Commit vote.
    - Once a quorum is reached:
        - The current leader creates a Finalize contract call on-chain for the fork (finalize_epoch).
        - The leader also finalizes the epoch delta using finalize_epoch_length if applicable.

#### Detailed Transaction Encoding

1. **Proposal transactions**
    1. ***Fork Proposal Transaction***

       A Fork Proposal transaction is a standard vote transaction with a minimal amount, sent from the producer to themselves, containing the proposal details in the fields.

          **Structure of Fork Proposal Transaction:**
            ```plaintext
             voter_id: ak_2cFaGrYvPgsEwMhDPXXrTj2CsW6XrA...
             epoch:42
             type:1
             data:
              block_hash:abc123def456ghi789
              signature:sg_7bf3c4e5d62a8e...
            ```

          - **Voter Id**: The public address of the proposing producer.
          - **Epoch**: The epoch number for which the proposal is made.
          - **Type**: `1` indicates the transaction is a fork proposal.
          - **Block Hash**: The hash of the proposed fork head.
          - **Signature**: The producer’s digital signature to ensure authenticity.

    2. **Speed of Chain Proposal Transaction**

       A Speed of Chain Proposal transaction is a standard vote transaction with a minimal amount, sent from the producer to themselves, containing the proposal details in the fields.

       **Structure of Speed of Chain Proposal Transaction:**

          ```plaintext
           voter_id: ak_2cFaGrYvPgsEwMhDPXXrTj2CsW6XrA...
           epoch:42
           type:4
           data:
            epoch_length_delta:2
            signature:sg_7bf3c4e5d62a8e...
          ```

          - **Voter Id**: The public address of the proposing producer.
          - **Epoch**: The epoch number for which the proposal is made.
          - **Type**: `4` indicates the transaction is a Speed of Chain Proposal Transaction.
          - **Signature**: The producer’s digital signature to ensure authenticity.

2. **Voting and Commit Transactions**

   Producers use vote transactions to cast their votes and commit to the final decision. Each transaction includes an payload specifying the vote or commit.

   They also vote on adjusting the next epoch length see [Epochs](#epochs).

     **Fork Vote Payload Example:**

     ```plaintext
     voter_id: ak_2cFaGrYvPgsEwMhDPXXrTj2CsW6XrA...
     epoch:42
     type:2
     data:
      block_hash:abc123def456ghi789
      signature:sg_7bf3c4e5d62a8e...
     ```

     - **Voter Id**: The public address of the proposing producer.
     - **Epoch**: The epoch number being voted on.
     - **Type**: `2` indicates the transaction is a vote.
     - **Block Hash**: The block hash for which the vote is cast.
     - **Signature**: The digital signature of the producer.


     **Speed of Chain Vote Payload Example:**

     ```plaintext
     voter_id: ak_2cFaGrYvPgsEwMhDPXXrTj2CsW6XrA...
     epoch:42
     type:5
     data:
      epoch_length_delta:2
      signature:sg_7bf3c4e5d62a8e...
     ```

     - **Voter Id**: The public address of the proposing producer.
     - **Epoch**: The epoch number being voted on.
     - **Type**: `5` indicates the transaction is a vote.
     - **Epoch length adjustment**: +/- N blocks. Increase or decrease the next cycle epoch length.
     - **Signature**: The digital signature of the producer.

     **Fork Commit Payload Example:**

     ```plaintext
     voter_id: ak_2cFaGrYvPgsEwMhDPXXrTj2CsW6XrA...
     epoch:42
     type:3
     data:
      block_hash:abc123def456ghi789
      signature:sg_7bf3c4e5d62a8e...
     ```

     - **Type**: `3` indicates the transaction is a commit.
     - **Other fields**: Same as the fork vote transaction.

     **Speed of Chain Commit Payload Example:**

     ```plaintext
     voter_id: ak_2cFaGrYvPgsEwMhDPXXrTj2CsW6XrA...
     epoch:42
     type:6
     data:
      epoch_length_delta:2
      signature:sg_7bf3c4e5d62a8e...
     ```

     - **Type**: `6` indicates the transaction is a commit.
     - **Other fields**: Same as the speed of chain vote transaction.

   Producers create and broadcast these transactions, using the transaction pool to share their votes and commits.

3. **Finalization Process**

   - Once the current producer detects that a quorum has been reached (two-thirds of the total stake), the leader generates a `finalize_epoch` call transaction on chain in the case of a fork vote or `finalize_epoch_length` in the case of a epoch delta vote.
   - These transactions are calls to leader election contract that confirms the chosen fork and/or epoch delta.
   - After finalization, the validators update their local states to reflect the newly chosen fork, adjust the epoch length and continue with the next epoch. Ignoring any fork they previously thought was good.


   1. **Detecting Quorum**:
      - Each producer monitors the transaction pool for incoming "Vote" transactions. When a producer observes that a proposal has received votes representing at least two-thirds of the total stake, it concludes that a quorum has been reached for that proposal.

   2. **Creating the "Finalize" Transactions**:
      - Once a quorum is detected for the fork proposal, the leader creates a "Finalize" transaction. This is an on chain contract
      call to the election contract `finalize_epoch`.
      - The arguments are:
        - **Epoch**: The epoch number for which the finalization is being done.
        - **Chosen Fork**: The block hash of the chosen fork.
        - **pc_root_hash**: The root hash at PC the given PC height that is used as seed for leader election.
        - **Producer**: The address of the producer creating the finalization transaction.
        - **Votes Proof**: A list of votes from other producers, each containing their transaction payloads.
          - The block hash they voted for.
          - The producer’s address.
          - The producer’s signature.
      - Once a quorum is detected for the chain speed proposal, the leader creates a "Finalize" transaction. This is an on chain contract
      call to the election contract `finalize_epoch_length`.
      - The arguments are:
        - **Epoch**: The epoch number for which the finalization is being done.
        - **new_epoch_length**: The length of the next epoch calculated adding proposed delta to the current length.
        - **pc_root_hash**: The root hash at PC the given PC height that is used as seed for leader election.
        - **Producer**: The address of the producer creating the finalization transaction.
        - **Votes Proof**: A list of votes from other producers, each containing their transaction payloads.
          - The epoch length delta they voted for.
          - The producer’s address.
          - The producer’s signature.
      - The calls are obviously signed by the producer creating the finalization transactions to ensure authenticity, as with any transaction/contract call. This is the same leader that is
      producing the block so the transaction will not be refused. A correct call should give a reward.
      an illegal call can be challenged and result in a penalty.

      By including the votes of other producers the call serves as verifiable proof that a quorum has been reached.
      - This call is recorded in the final block of the epoch.

   3. **Updating Local States**:
      - Upon verifying the "Finalize" transaction, all validators update their local state to reflect the chosen fork as the correct chain.
      - The network then proceeds to the next epoch based on this agreed-upon state.

#### Timeouts

To implement a robust BFT voting mechanism, it's essential to establish clear rules for timeouts, handle situations where a majority is not reached, and address scenarios where a leader might ignore some votes and create a minority vote in the finalization. Here's how we can approach these challenges:

##### Setting Timeouts

The timeouts for each phase of the voting process is the child block time.
When calculation the leader schedule for one epoch we also calculate 5 more leaders past the last leader.
If the last leader doesn't start the voting in time the next leader can start the voting instead.

- **Proposal Timeout**: A predefined period (i.e., child block time) within which the leader can submit it's fork proposal. After this period, no proposal is accepted.

- **Voting Timeout**: A defined period (i.e., child block time) for validators to submit their votes for a fork proposal. This time window allows all validators to observe the proposals and cast their votes.

- **Finalization Timeout**: A specified period (i.e., child block time) after the voting phase ends, within which a validator must create and broadcast the "Finalize" transaction. If no finalization occurs within this period, the network takes predefined corrective actions. (The new leader in the next epoch just runs with his preferred fork.)

##### Handling Scenarios Where a Majority is Not Reached
If a quorum (two-thirds of the total stake) is not reached within the voting timeout the next leader in the current epoch.

##### Handling Minority Vote in Finalization

If a validator ignores some votes and attempts to create a minority vote in the finalization process, the following steps can be taken:

- **Reject Invalid Finalization Transactions**: Validators must verify the "Finalize" transaction against the recorded votes in the vote pool. If the transaction does not include votes representing at least two-thirds of the total stake, it is considered invalid, and validators should ignore it.

- **Slashing Penalties for Malicious Behavior**: If a validator is found to have created a minority "Finalize" transaction deliberately (i.e., one that lacks sufficient proof of a majority), they can be penalized through slashing. This involves reducing the validator's stake (the deposit in the election contract) and if the
deposit is less than the minimum temporarily banning them from participating in future consensus rounds.

##### Handling Double Voting

If a double vote, two or more voting transaction by the same validator on two different forks in the same epoch,
is detected, anyone can submit the two signed transactions to the election contract for a reward and resulting
in a penalty for the offending validator.

### Rewards and Penalties

Incentives are critical for maintaining the network's security, fairness, and proper functioning.

#### Rewards

Rewards are provided to validators for performing key roles in the network, such as block production, validation, and pinning.

1. **Block Production and Validation:**

   Validators who produce or validate blocks receive rewards, which include:
   - **Transaction Fees**: The validator collects all transaction fees from the transactions included in the block they produce.
   - **Block Reward**: An additional reward, configurable at chain initialization, paid to the validator for each successfully produced and validated block. This reward serves as a further incentive for validators to participate actively in the network and is paid out during the payout cycle.

   These rewards are credited to the validator's account at the end of the payout cycle, ensuring a consistent reward schedule.

2. **Pinning Reward:**

   Pinning is a process where a validator or participant securely anchors the hyperchain to the PC, leveraging the security attributes of the PC. The network rewards validators for performing pinning actions.

   - **Reward Mechanism**: A validator selected to perform the pinning action for each generation is rewarded for successfully completing it. The reward is paid out in the subsequent payout cycle.
   - **Cumulative Reward Strategy**: If the selected validator fails to perform the pinning, the reward for the next block is increased, creating a stronger incentive for subsequent validators to complete the pinning. Once the pinning is performed, the reward resets to its base level.

   This cumulative reward mechanism encourages participation in pinning when the reward outweighs
   the transaction fee of the PC.

#### Penalties and Slashable Events

Penalties are enforced to deter malicious actions or protocol violations. Slashable events are actions that result in the forfeiture of a validator's stake, reputation, or other penalties to maintain network integrity and fairness. Any participant can submit proof of such wrongdoing, ensuring a decentralized and fair enforcement mechanism.

1. **Producing Two Versions of a Block at a Specific Height (Double-Spending Attack):**

   - **Definition**: A validator produces two different blocks at the same height, effectively attempting a double-spending attack or creating ambiguity in the chain.
   - **Penalty**: The validator's stake is slashed (partially or entirely), and they are barred from participating in future leader elections for a specified period. The network may also burn a portion of their stake as a deterrent to others.

2. **Double Voting:**

   - **Definition**: A validator casts multiple votes for different forks or outcomes in a single voting phase. This action is considered malicious and undermines the voting process.
   - **Penalty**: The validator's stake is slashed, and their voting rights are suspended for one or more epochs. The network may also distribute the slashed amount among honest validators as a reward for maintaining integrity.

3. **Not producing blocks:**

   - **Definition**: A validator that was chosen leader but that does not produce any
                     valid or in time blocks during an epoch.
   - **Penalty**: The validator's stake is partially slashed down below minimum stake,
   causing a temporary ban from participating in leader elections and block production.

4. **Ignoring the finalize_epoch fork**: This is a minor event just as any other incorrect block. It should probably just be ignored with no penalty.

5. **Ignoring a correctly pinned fork**: This is a minor event just as any other incorrect block. It should probably just be ignored with no penalty.


#### Submitting Proof of Wrongdoings

Any participant can submit proof of a validator's wrongdoing by creating a special "Proof of Misconduct" call to the election contract. This call includes:

- **Evidence**: Detailed evidence of the wrongdoing, such as signed conflicting blocks or votes, omitted votes, or any verifiable proof. (The format for this has to be specified by the contract.)
- **Reporter Address**: The address of the participant submitting the proof.
- **Signature**: The digital signature of the reporter to ensure authenticity.

Upon receiving a valid "Proof of Misconduct" transaction, the network:
1. Verifies the evidence provided against the public chain data.
2. If verified, applies the specified penalties to the offending validator.
3. Rewards the reporter with a portion of the slashed stake.



### CC design


Exactly how the CC is designed is very much unclear. It needs to be able to
follow a leader schedule. This means it has to deal with leaders misbehaving,
and it most likely has to have a sense of time.


Stake has to be translated to a notion of difficulty/weight in order to make
selecting a harder/heavier fork possible.

## Block time specification

The hyperchain blocktime is defined as the time between each keyblock being produced.
The specifics on how nodes should deal with this blocktime are provided here.

Important terminology in this setting are
 - `child_block_time`: (Abbreviated to just "blocktime" in this section.) The average time between child chain block timestamps in ms. E.g. 3000 ms. This is configured when setting up the hyperchain. (Note should be renamed to `hc_block_time` in config.)
 - `hc_block_production_time`: (Called block production time or BPT here.) The time (in ms) it takes to produce both a micro block and a keyblock from a given transaction mempool. The real production time is not a constant, but some kind of maximum worst case can be determined, since a micro block has a maximum gas limit and gas is related to computation time. This should be configured when setting up the hyperchain and is indicative of the minimum hardware requirements for a producer on the chain. E.g 500 ms.
 - block latency: 2x the time it takes for a block to be gossiped from the producer to any other node. Clearly latency is not a constant but depends on the network conditions. The configuration constant (used for further calculations) is calculated as `blocktime - block production time`. E.g 3000 - 500 = 2500 ms.
 - Block `timestamp`: is the UTC timestamp in milliseconds that is part of each keyblock (header)
 - timestamp(N): same as Block timestamp for a specific keyblock at height N.
 - `T0` (start time) `T0 = timestamp(1) - (block production time + (block latency / 2))`. This is the start time of epoch 1 on the hyperchain (block 0 is the genesis block, block 1 is the first block produced when entropy is known).
 - `EpochT0(E)` refers to the Block timestamp of the first block of epoch E (`T0` is `EpochT0(1)`).
 - Minimum block timestamp: The timestamp of the Nth block in epoch E should be larger or equal to `(N-1) *  blocktime + EpochT0(E)`. The minimum block timestamp of the first block of an epoch is `T0 + (height-1) * blocktime`.
 - Maximum block timestamp: The timestamp of the Nth block in Epoch E should be smaller or equal to `(N-1) * blocktime + EpochT0(E) + block production time + (block latency / 2)`.

Important properties are
 - Blocktime should be larger or equal to block production time + block latency time. Since the blocktime is configured, some experimentation must be done by the creator of a hyperchain to make sure the network and hardware has the capability to fulfill this property.

The idea between the above values is that a node can start preparing an empty block, micro block and keyblock before the actual minimum block timestamp is due. It will get informed on a kind of maximum block production time that that took and can then wait until the deadline minus the expected production time for the previous keyblock to arrive. If nothing arrives, the empty block solution can be submitted. If a block does arrive, it can produce a new block on top of it and submit.

```mermaid
gantt
    dateFormat  x
    axisFormat %S%L
    title Hyperchain Blocktime (3000ms) and Block Production/Latency Flow (ms UTC)

    section Block times
    Block Time N: done, block_time, 0, 3000
    Block Time N+1: done, block_time, 3000, 6000
    Block Production Time: done, production_time, 0, 500
    Block Latency Time: done, latency_time, 500, 3000
    Minimum Block Timestamp N: milestone, min_block_timestamp, 0, 0
    Start Block N production: milestone, max_block_timestamp, 1250, 1250
    Maximum Block Timestamp N: milestone, max_block_timestamp, 1750, 1750
    Minimum Block Timestamp N+1: milestone, min_block_timestamp, 3000, 3000
    Block N Arrival Cutoff: milestone, keyblock_arrived, 3750, 3750
    Maximum Block Timestamp N+1: milestone, keyblock_arrived, 4750, 4750

    section Normal Operation
    Block Production N: done, production_start, 1250, 1750
    Bock Timestamp N: milestone, min_block_timestamp, 1750, 1750
    Block Gossip (Latency): done, gossip_start, 1750, 3250
    Block Production N+1: done, production_start, 4250, 4750

    section Late or No Block Arrival
    Block Production: done, late_production_start, 1250, 1750
    Block Gossip (Latency): done, late_gossip_start, 1750, 4750
    Block Production Hole N: crit, late_process_start, 3750, 4250
    Block Production N+1: crit, late_process_start, 4250, 4750
```

There is one quirk in here. If we ever get stuck on not having a parent seed to build upon, then the timing is completely off. We will have block timestamp requirements for times in the past.
To avoid this, we set a new epoch timestamp. Not sure this is a good idea, but the only was to recover if all our work on making epochs longer etc does not work any more....

### Block timing algorithm

The producer of block N+1 should follow the following algorithm (as long as it isn't the last block in the epoch.)

Given that the Minimum Block Timestamp for N+1 is MinBT:
- 1: Calculate `MaxBT = MinBT + block production time + (block latency / 2)`.
- 2: Calculate `SPT = MaxBT - block production time`.
- 3: Calculate `CutOffTime = MaxBT - 2 * block production time`.
- 4: Wait for block N and all previous blocks so that the full state of the chain is known.
   If we reach the CutOffTime go to `late`.
- 5: If transaction pool >> what fits in a block: produce a block and gossip ASAP.
   else wait for more transactions until `SPT`.
- 6: At `SPT` produce a block and gossip. Go to `end`.
- `late`: Produce `Hole keyblocks` for any missing blocks + produce block N+1 and gossip.
- `end`: Find out if I have another block to produce in this Epoch, repeat for that block.




# Benefits and Advantages

The proposed solution enables piggybacking one chains consensus on the consensus of a different chain. Compared to earlier proposals, this solution needs not have the chains in lock step. Hence the child chain can have a larger transaction throughput than the parent chain is so demanded. The solution makes it also more economic in the cost of posting transactions to the parent chain. Not only may we need less transactions, we also can postpone generating such a transaction until the reward on the child chain is beneficial for posting such transaction.

# Challenges and Limitations
Risks to address:

* Parent chain miner has any influence on leader election
* Stakeholders can manipulate leader election
* Non-active leader causes non-progression for chain
* Leader can ignore switch to new leader, taking over control
* Parent chain can cause total stop for progress child chain
* Child chain cannot keep up with transaction cost of parent chain
* The child chain gets out of sync with the parent chain
* Ability to withstand long-range attacks


# Conclusion
Summarize the key points discussed in the whitepaper.
Restate the significance of the problem and the proposed solution.

# References



* 2017 aeternity Whitepaper - The original whitepaper. Repository: https://github.com/aeternity/whitepaper
* 2020 aeternity Whitepaper - Draft that reflects the current state. Repository: https://github.com/aeternity/white-paper

[1] Bentov, I., Gabizon, A., and Mizrahi, A. Cryptocurrencies without proof of work.

[2] Bonneau, J., Clark, J., and Goldfeder, S. On bitcoin as a public randomness source.

[3] Buterin, V., and Griffith, V. Casper the friendly finality gadget.

[4] DEIRMENTZOGLOU, E., PAPAKYRIAKOPOULOS, G., and PATSAKIS, C. A survey on long-range attacks forproof of stake protocols.

[5] Dickman, T. Pow 51% attack cost.

[6] Eyal, I., Gencer, A. E., Sirer, E. G., and van Renesse, R. Bitcoin-ng: A scalable blockchain protocol.

[7] Kiayias, A., Russell, A., David, B., and Oliynykov, R. Ouroboros: A provably secure proof-ofstake blockchain protocol.

[8] King, S., and Nadal, S. Ppcoin: Peer-to-peer crypto-currency with proof-of-stake.

[9] Lee, T. B. Bitcoin’s insane energy consumption, explained, 2017.

[10] Malahov, Y. G. Hyperchains — secure, cheap & scalable blockchain technology for everyone, 2016.

[11] Nakamoto, S. Bitcoin: A peer-to-peer electronic cash system.

[12] Niu, J., Wang, Z., Gai, F., and Feng, C. Incentive analysis of bitcoin-ng, revisited.

[13] Nxt community. Nxt whitepaper, 2016.

[14] Sharma, A. Understanding proof of stake through it’s flaws. part 2 — ‘nothing’s at stake’, 2018.

[15] Sharma, A. Understanding proof of stake through it’s flaws. part 3 — ‘long range attacks’, 2018.

[16] Urisaz, Radoslaw et all. Æternity Hyperchains, https://github.com/aeternity/hyperchains-whitepaper/releases/download/1.0.0/whitepaper.pdf, 2020.
