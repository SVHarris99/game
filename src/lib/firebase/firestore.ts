import {
  collection,
  doc,
  type CollectionReference,
  type DocumentReference,
} from "firebase/firestore";
import { getFirestoreDb } from "./config";
import type { RoomDocument, PlayerDocument, SecretDocument } from "@/types/game";

export function roomRef(code: string): DocumentReference<RoomDocument> {
  return doc(getFirestoreDb(), "rooms", code) as DocumentReference<RoomDocument>;
}

export function playersCollection(
  roomCode: string
): CollectionReference<PlayerDocument> {
  return collection(
    getFirestoreDb(),
    "rooms",
    roomCode,
    "players"
  ) as CollectionReference<PlayerDocument>;
}

export function playerRef(
  roomCode: string,
  playerId: string
): DocumentReference<PlayerDocument> {
  return doc(
    getFirestoreDb(),
    "rooms",
    roomCode,
    "players",
    playerId
  ) as DocumentReference<PlayerDocument>;
}

export function secretsCollection(
  roomCode: string
): CollectionReference<SecretDocument> {
  return collection(
    getFirestoreDb(),
    "rooms",
    roomCode,
    "secrets"
  ) as CollectionReference<SecretDocument>;
}

export function secretRef(
  roomCode: string,
  playerId: string
): DocumentReference<SecretDocument> {
  return doc(
    getFirestoreDb(),
    "rooms",
    roomCode,
    "secrets",
    playerId
  ) as DocumentReference<SecretDocument>;
}
