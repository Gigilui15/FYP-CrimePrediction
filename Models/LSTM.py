import os
import numpy as np
import pandas as pd
from sklearn.metrics import mean_squared_error
from sklearn.preprocessing import MinMaxScaler
from keras.models import Sequential
from keras.layers import LSTM, Dense
from keras import backend as K
import tensorflow as tf

# Set GPU device (optional)
os.environ["CUDA_VISIBLE_DEVICES"]="0"

# Check GPU availability
print("Num GPUs Available: ", len(tf.config.experimental.list_physical_devices('GPU')))

# Configure Keras to use TensorFlow backend
os.environ['KERAS_BACKEND'] = 'tensorflow'

# Allow GPU memory growth
gpus = tf.config.experimental.list_physical_devices('GPU')
if gpus:
    try:
        for gpu in gpus:
            tf.config.experimental.set_memory_growth(gpu, True)
    except RuntimeError as e:
        print(e)

# Load the dataset
train_data = pd.read_csv(r'C:\\Users\\luigi\\Desktop\\Third Year\\Thesis\\Artefact\\TrainTestSplit\\train_set.csv')

# Extract the target variable
y_train = train_data['total_crimes'].values

# Normalize the target variable
scaler = MinMaxScaler(feature_range=(0, 1))
y_train_scaled = scaler.fit_transform(y_train.reshape(-1, 1))

# Define a function to create input sequences for LSTM
def create_sequences(data, seq_length):
    X, y = [], []
    for i in range(len(data) - seq_length):
        X.append(data[i:i+seq_length])
        y.append(data[i+seq_length])
    return np.array(X), np.array(y)

# Define sequence length
seq_length = 10

# Create input sequences
X_train, y_train = create_sequences(y_train_scaled, seq_length)

# Reshape input sequences for LSTM (samples, time steps, features)
X_train = np.reshape(X_train, (X_train.shape[0], X_train.shape[1], 1))

# Define the LSTM model
model = Sequential()
model.add(LSTM(units=50, return_sequences=True, input_shape=(X_train.shape[1], 1)))
model.add(LSTM(units=50))
model.add(Dense(units=1))

# Compile the model
model.compile(optimizer='adam', loss='mean_squared_error')

# Print the backend device
print("Backend Device:", K.backend())

# Train the model
model.fit(X_train, y_train, epochs=1000, batch_size=32)

# Load the test dataset
test_data = pd.read_csv(r'C:\\Users\\luigi\\Desktop\\Third Year\\Thesis\\Artefact\\TrainTestSplit\\test_set.csv')

# Extract the target variable
y_test = test_data['total_crimes'].values

# Normalize the target variable using the same scaler
y_test_scaled = scaler.transform(y_test.reshape(-1, 1))

# Create input sequences for the test data
X_test, y_test = create_sequences(y_test_scaled, seq_length)
X_test = np.reshape(X_test, (X_test.shape[0], X_test.shape[1], 1))

# Predict on the test data
y_pred_scaled = model.predict(X_test)

# Inverse transform the predicted values
y_pred = scaler.inverse_transform(y_pred_scaled)

# Calculate Mean Squared Error (MSE) as an evaluation metric
mse = mean_squared_error(y_test, y_pred)
print("Mean Squared Error (LSTM):", mse)
