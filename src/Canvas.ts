import {
  Field,
  SmartContract,
  state,
  State,
  method,
  Permissions,
  Circuit,
  PublicKey,
  PrivateKey,
  Bool,
} from 'snarkyjs';

import type { DeployArgs } from 'snarkyjs';

import { CanvasDataFactory } from './helpers/CanvasData';
import { ClaimListFactory } from './helpers/ClaimList';

class CanvasData extends CanvasDataFactory(3) {}
class ClaimList1 extends ClaimListFactory(1) {}

export class Canvas extends SmartContract {
  @state(Field) canvasHash = State<Field>();

  deploy(args: DeployArgs) {
    super.deploy(args);
    this.setPermissions({
      ...Permissions.default(),
      editState: Permissions.proof(),
    });
  }

  @method
  init() {
    this.canvasHash.set(CanvasData.blank().hash());
  }

  assertValidCanvas(canvasData: CanvasData) {
    const assertedHash = canvasData.hash();
    const actualHash = this.canvasHash.get();
    this.canvasHash.assertEquals(this.canvasHash.get());
    actualHash.assertEquals(assertedHash);
  }

  @method
  claimCells(canvasData: CanvasData, claimList: ClaimList1, pkey: PrivateKey) {
    this.assertValidCanvas(canvasData);
    const mutatedCanvas = canvasData.copy();
    const pubKey = PublicKey.fromPrivateKey(pkey);
    // assert user has fewer than x claims already #TODO
    for (let i = 0; i < CanvasData.size; i++) {
      for (let j = 0; j < CanvasData.size; j++) {
        claimList.claims.forEach((claim) => {
          const cell = mutatedCanvas.value[i][j];
          const newOwner = Circuit.if(
            Bool.and(Field(i).equals(claim[0]), Field(j).equals(claim[1])),
            pubKey,
            cell.owner
          );
          mutatedCanvas.updateCellOwner(i, j, newOwner);
        });
      }
    }
    this.canvasHash.set(mutatedCanvas.hash());
  }
}
