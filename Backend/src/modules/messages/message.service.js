import {
  create,
  find,
  findOne,
  findOneAndDelete,
  MessageModel,
  UserModel,
} from "../../db/index.js";
import { NotFoundException } from "../../common/utils/index.js";

export const sendMessage = async (
  receiverID,
  { content = undefined } = {},
  files,
  user,
) => {
  const account = await findOne({
    model: UserModel,
    filter: { _id: receiverID, confirmEmail: { $exists: true } },
  });
  if (!account) {
    return NotFoundException({ message: "no such user with this id" });
  }

  const message = await create({
    model: MessageModel,
    data: {
      attachments: files.map((file) => file.finalPath),
      receiverId: receiverID,
      content,
      senderId: user ? user._id : undefined,
    },
  });

  return message;
};
export const getMessage = async (messageId, user) => {
  const message = await findOne({
    model: MessageModel,
    filter: {
      _id: messageId,
      $or: [
        {
          senderId: user._id,
        },
        {
          receiverId: user._id,
        },
      ],
    },
    select: "-senderId",
  });
  if (!message) {
    return NotFoundException({ message: "no such message with this id" });
  }

  return message;
};

export const getAllMessages = async (user) => {
  const messages = await find({
    model: MessageModel,
    filter: {
       $or: [
        {
          senderId: user._id,
        },
        {
          receiverId: user._id,
        },
      ],
    },
  });
  return messages;
};

export const deleteMessage = async (messageId, user) => {
  const message = await findOneAndDelete({
    model: MessageModel,
    filter: {
      _id: messageId,
      receiverId: user._id,
    },
  });
  return message;
};
