import pandas as pd
import numpy as np
from sklearn.preprocessing import MinMaxScaler
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense

# Define hyperparameters
nodes = 67
dense_units = 10
dropout = 0.41856136469948013
learning_rate = 0.41856136469948013
momentum = 0.5369234907053951
batch_size = 32
seed = 18
epochs = 10

# Hyperparameters for optimizer and activation function
optimizer_name = 'sgd' 
activation_function = 'tanh'  

# Load the dataset
dataset = pd.read_csv('C:\\Users\\luigi\\Desktop\\Third Year\\Thesis\\Artefact\\TrainTestSplit\\train_set_ordered.csv')

# Extract features and target variable
X = dataset[['area', 'year', 'month', 'agg_id']].values
y = dataset['total_crimes'].values

# Normalize features
scaler_X = MinMaxScaler()
X_scaled = scaler_X.fit_transform(X)

# Normalize target variable
scaler_y = MinMaxScaler()
y_scaled = scaler_y.fit_transform(y.reshape(-1, 1))

# Reshape input to be 3D [samples, timesteps, features]
X_reshaped = X_scaled.reshape((X_scaled.shape[0], 1, X_scaled.shape[1]))

# Define the LSTM model
model = Sequential()
model.add(LSTM(nodes, activation=activation_function, input_shape=(1, X_scaled.shape[1]), dropout=dropout))  # Include dropout here
model.add(Dense(dense_units))
model.compile(optimizer=optimizer, loss='mse')

# Accessing hyperparameters and attributes directly
print("\nNumber of LSTM units:", model.layers[0].units)
print("Activation function:", activation_function)
print("Optimizer:", optimizer)
print("Learning rate:", model.optimizer.learning_rate.numpy())  # Assuming it's a TensorFlow optimizer
print("Loss function:", model.loss)

# Print additional parameters
print("Dropout:", dropout)
print("Batch size:", batch_size)
print("Seed:", seed)
print("Epochs:", epochs ,"\n")

# Set the random seed
np.random.seed(seed)

# Fit the model
model.fit(X_reshaped, y_scaled, epochs=epochs, batch_size=batch_size, verbose=1)

# Save the model
model.save('lstm_model.h5')
#0.03308010473847389 and parameters: {'nodes': 67, 'dense_units': 10, 'dropout': 0.41856136469948013, 'learning_rate': 0.41856136469948013, 'momentum': 0.5369234907053951, 'batch_size': 32, 'seed': 18, 'epochs': 23, 'optimizer_name': 'sgd', 'activation_function': 'tanh'}. Best is trial 1 with value: 0.03308010473847389.