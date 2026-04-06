import mongoose, { Document, Model, Schema } from 'mongoose'

export interface IAppSetting extends Document {
  key: string
  watermarkEnabled: boolean
  createdAt: Date
  updatedAt: Date
}

const AppSettingSchema = new Schema<IAppSetting>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: 'global',
      trim: true,
    },
    watermarkEnabled: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
)

const AppSetting: Model<IAppSetting> =
  (mongoose.models.AppSetting as Model<IAppSetting>) ||
  mongoose.model<IAppSetting>('AppSetting', AppSettingSchema)

export default AppSetting
