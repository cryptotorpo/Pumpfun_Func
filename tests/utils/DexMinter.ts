import { Address, toNano } from '@ton/core';
import BN from 'bn.js';

import { JettonMinter } from '../../wrappers/JettonMinter';

const ALICE_INITIAL_BALANCE = toNano(3500);
const JETTON_LIQUIDITY = toNano(10);
const TON_LIQUIDITY = toNano(5);
const LP_DEFAULT_AMOUNT = 7071067;

const GAS_FEES = {
    ADD_LIQUIDITY: '0.2',
};

const alice = Address.parse('EQCLjyIQ9bF5t9h3oczEX3hPVK4tpW2Dqby0eHOH1y5_Nvb7');

export async function createBaseContracts() {
    const masterUSDC = await JettonMinter.Create(new BN(0), alice, 'https://ipfs.io/ipfs/dasadas');
    const mintResponse = await masterUSDC.mint(alice, alice, new BN(ALICE_INITIAL_BALANCE));
    if (!mintResponse) {
        throw 'bad mint response';
    }
    const mintMessage = mintResponse.actionList[0] as SendMsgAction;
    //send the transfer message to the contract
    const mintTransferNotification = actionToMessage(masterUSDC.address as Address, mintResponse.actionList[0]);

    // Deploy USDC Sub wallet based on the output action from the mint result,
    // so we take the output message and initiate a contract based on the code data and init state and save reference to it
    let aliceUSDC = await JettonWallet.createFromMessage(
        mintMessage.message?.init?.code as Cell,
        mintMessage.message?.init?.data as Cell,
        mintTransferNotification,
    );

    return {
        masterUSDC,
        aliceUSDC,
    };
}

export async function initAMM({
    jettonLiquidity = JETTON_LIQUIDITY,
    tonLiquidity = TON_LIQUIDITY,
    addLiquiditySlippage = new BN(5),
}) {
    const { aliceUSDC } = await createBaseContracts();

    const forwardTon: BigInt = tonLiquidity + toNano(GAS_FEES.ADD_LIQUIDITY);
    const transferWithAddLiquidityResponse = await aliceUSDC.transfer(
        alice,
        amm,
        jettonLiquidity,
        amm,
        undefined,
        forwardTon,
        OPS.ADD_LIQUIDITY,
        addLiquiditySlippage, // slippage
        tonLiquidity,
    );

    expect(transferWithAddLiquidityResponse.exit_code).toBe(0);

    const jettonTransferToAmmWallet = transferWithAddLiquidityResponse.actionList[0] as SendMsgAction;
    const jettonInternalTransferMessage = actionToMessage(
        aliceUSDC.address,
        transferWithAddLiquidityResponse.actionList[0],
    );

    const ammUsdcWallet = await JettonWallet.createFromMessage(
        jettonTransferToAmmWallet.message?.init?.code as Cell,
        jettonTransferToAmmWallet.message?.init?.data as Cell,
        jettonInternalTransferMessage,
    );

    const masterAMM = new AmmMinterTVM('https://ipfs.io/ipfs/dasadas', alice);
    await masterAMM.ready;

    const { tokenWalletAddress } = await masterAMM.getData();
    expect(tokenWalletAddress).toBe(ZERO_ADDRESS.toFriendly());

    const usdcToAmmTransferNotification = actionToMessage(
        ammUsdcWallet.address as Address,
        ammUsdcWallet.initMessageResult.actionList[0],
        forwardTon,
    );

    let ammRes = await masterAMM.sendInternalMessage(usdcToAmmTransferNotification);
    expect(ammRes.exit_code).toBe(0);

    let mintLpMessage = ammRes.actionList[0] as SendMsgAction;

    const lpMsg = actionToMessage(masterAMM.address as Address, ammRes.actionList[0]);
    const lpWallet = await AmmLpWallet.createFromMessage(
        mintLpMessage.message?.init?.code as Cell,
        mintLpMessage.message?.init?.data as Cell,
        lpMsg,
    );

    let lpData = await lpWallet.getData();
    expect(lpData.balance.toString()).toBe(LP_DEFAULT_AMOUNT.toString()); // lp amount

    return {
        aliceUSDC,
        masterAMM,
        ammUsdcWallet,
        lpWallet,
    };
}
