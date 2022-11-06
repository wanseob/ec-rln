pragma circom 2.0.0;
include "./lib/flattened-lib.circom";

template EthAddress() {
    // public
    signal input address;
    // private
    signal input privateKey;

    component privateKey256bits = Num2Bits(256);
    privateKey256bits.in <== privateKey;
    component privateKey64bits0 = Bits2Num(64);
    component privateKey64bits1 = Bits2Num(64);
    component privateKey64bits2 = Bits2Num(64);
    component privateKey64bits3 = Bits2Num(64);

    for (var i = 0; i < 64; i++) {
        privateKey64bits0.in[i] <== privateKey256bits.out[i];
        privateKey64bits1.in[i] <== privateKey256bits.out[i+64];
        privateKey64bits2.in[i] <== privateKey256bits.out[i+128];
        privateKey64bits3.in[i] <== privateKey256bits.out[i+192];
    }

    component ethAddress = PrivKeyToAddr(64, 4);
    ethAddress.privkey[0] <== privateKey64bits0.out;
    ethAddress.privkey[1] <== privateKey64bits1.out;
    ethAddress.privkey[2] <== privateKey64bits2.out;
    ethAddress.privkey[3] <== privateKey64bits3.out;
    ethAddress.addr === address;
}

template ECMulVerifier(threshold) {
    // public
    signal input address;
    signal input epochCommitment[2];
    // private
    signal input privateKey;
    signal input sharedKeys[threshold + 1];

    component ethAddress = EthAddress();
    ethAddress.address <== address;
    ethAddress.privateKey <== privateKey;

    var BASE8[2] = [
        5299619240641551281634865583518297030282874472190772894086521144482721001553,
        16950150798460657717958625567821834550301663161624707787222815936182638968203
    ];

    component mulFix[threshold + 1];
    component scalarBits[threshold + 1];

    for (var i = 0; i<threshold +1; i++) {
        if(i == 0) {
            mulFix[i] = EscalarMulAny(253);
            mulFix[i].p[0] <== BASE8[0];
            mulFix[i].p[1] <== BASE8[1];
        } else {
            mulFix[i] = EscalarMulAny(253);
            mulFix[i].p[0] <== mulFix[i - 1].out[0];
            mulFix[i].p[1] <== mulFix[i - 1].out[1];
        }
        scalarBits[i] = Num2Bits(253);
        scalarBits[i].in <== sharedKeys[i];

        for (var j=0; j<253; j++) {
            mulFix[i].e[j] <== scalarBits[i].out[j];
        }
    }
    // mulFix[threshold].out[0] === epochCommitment[0]; // needs debugging
    // mulFix[threshold].out[1] === epochCommitment[1];
}

component main { public [address, epochCommitment] } = ECMulVerifier(5);
