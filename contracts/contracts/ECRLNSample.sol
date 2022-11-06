//SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity >=0.8.0;

// Please note that you should adjust the length of the inputs
interface IVerifier {
    function verifyProof(
        uint256[2] memory a,
        uint256[2][2] memory b,
        uint256[2] memory c,
        uint256[3] memory input
    ) external view returns (bool r);
}

contract ECRLNSample {
    struct Proof {
        uint256[2] a;
        uint256[2][2] b;
        uint256[2] c;
    }

    struct Session {
        uint256[2] epochCommitment;
        uint256[] nullifiers;
    }

    address public immutable verifier;
    mapping(address => Session[]) sessions;

    constructor(address verifier_) {
        verifier = verifier_;
    }

    /**
     * @dev This is the sample onchain function. You don't need to make it onchain
     */
    function startSession(uint256[3] memory publicSignals, Proof memory proof)
        public
    {
        require(verify(publicSignals, proof), "SNARK verification failed");
        address clientAddress = address(uint160(publicSignals[0]));
        Session memory session;
        session.epochCommitment[0] = publicSignals[1];
        session.epochCommitment[1] = publicSignals[2];
        sessions[clientAddress].push(session);
    }

    function sendMessage(
        address clientAddress,
        uint256[2] memory refPoint,
        uint256 sharedSecret
    ) public returns (uint256) {
        require(
            sessions[clientAddress].length > 0,
            "You don't have any session"
        );
        Session storage currentSession = sessions[clientAddress][
            sessions[clientAddress].length - 1
        ];
        // babyjubjub ec mul, (don't have the opcode yet but you can do it offchain)
        require(
            pairing(refPoint, sharedSecret, currentSession.epochCommitment),
            "Not a same polynomial"
        );
        currentSession.nullifiers.push(sharedSecret);
    }

    function pairing(
        uint256[2] memory refPoint,
        uint256 sharedSecret,
        uint256[2] memory epochCommitment
    ) public view returns (bool) {
        // do the ec pairing here to check refPoint*sharedSecret constructs the epochCommitment;
        return true;
    }

    /**
     * Please adjust the IVerifier.sol and the array length of publicSignals
     */
    function verify(uint256[3] memory publicSignals, Proof memory proof)
        public
        view
        returns (bool)
    {
        bool result = IVerifier(verifier).verifyProof(
            proof.a,
            proof.b,
            proof.c,
            publicSignals
        );
        return result;
    }

    function getSession(address clientAddress)
        public
        view
        returns (
            uint256 epoch,
            uint256[2] memory epochCommitment,
            uint256[] memory nullifiers
        )
    {
        if (sessions[clientAddress].length == 0) {
            return (0, [uint256(0), uint256(0)], new uint256[](0));
        } else {
            uint256 currentEpoch = sessions[clientAddress].length - 1;
            Session memory session = sessions[clientAddress][currentEpoch];
            return (currentEpoch, session.epochCommitment, session.nullifiers);
        }
    }
}
